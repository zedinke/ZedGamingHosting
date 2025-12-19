import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@libs/db';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userData?: {
    id: string;
    email: string;
    role: string;
  };
}

interface WsMessage {
  type: string;
  data: any;
  timestamp?: number;
}

/**
 * WebSocket Gateway for real-time updates
 * Handles support tickets, server status, and notifications
 * Authenticated with JWT tokens
 */
@Injectable()
@WebSocketGateway({
  namespace: '/ws',
  transports: ['websocket', 'polling'],
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Middleware for authentication
    server.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token ||
          socket.handshake.headers['authorization']?.split(' ')[1];

        if (!token) {
          throw new WsException('Unauthorized: No token provided');
        }

        const decoded = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET'),
        });

        socket.userId = decoded.sub || decoded.id;
        socket.userData = decoded;
        next();
      } catch (error) {
        next(new WsException('Unauthorized: Invalid token'));
      }
    });
  }

  async handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    this.logger.log(`Client connected: ${socket.id}, User: ${userId}`);

    try {
      // Verify user exists
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        socket.disconnect(true);
        return;
      }

      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);
      socket.join(`role:${user.role}`);

      // Notify user they're connected
      socket.emit('connected', {
        message: 'Connected to WebSocket server',
        userId,
        timestamp: new Date(),
      });

      // Broadcast online status to admin if user is staff
      if (user.role === 'ADMIN' || user.role === 'SUPPORT_STAFF') {
        this.server.emit('staff:online', {
          userId,
          email: user.email,
          role: user.role,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Connection handler error: ${error.message}`);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    this.logger.log(`Client disconnected: ${socket.id}, User: ${userId}`);

    try {
      if (userId) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);

            // Broadcast offline status
            const user = await this.prismaService.user.findUnique({
              where: { id: userId },
              select: { role: true },
            });

            if (user?.role === 'ADMIN' || user?.role === 'SUPPORT_STAFF') {
              this.server.emit('staff:offline', {
                userId,
                timestamp: new Date(),
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Disconnect handler error: ${error.message}`);
    }
  }

  /**
   * Support Ticket Events
   */

  @SubscribeMessage('support:subscribeTicket')
  async handleSubscribeTicket(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    try {
      const { ticketId } = data;
      const userId = socket.userId;

      // Verify user has access to this ticket
      const ticket = await this.prismaService.supportTicket.findUnique({
        where: { id: ticketId },
        select: { id: true, userId: true },
      });

      if (!ticket) {
        throw new WsException('Ticket not found');
      }

      // User can subscribe if they own the ticket or are admin
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (ticket.userId !== userId && user?.role !== 'ADMIN' && user?.role !== 'SUPPORT_STAFF') {
        throw new WsException('Unauthorized');
      }

      // Join ticket-specific room
      socket.join(`ticket:${ticketId}`);
      socket.emit('support:subscribed', { ticketId, timestamp: new Date() });

      this.logger.log(`User ${userId} subscribed to ticket ${ticketId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('support:unsubscribeTicket')
  handleUnsubscribeTicket(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string }
  ) {
    const { ticketId } = data;
    socket.leave(`ticket:${ticketId}`);
    socket.emit('support:unsubscribed', { ticketId, timestamp: new Date() });
    this.logger.log(`User ${socket.userId} unsubscribed from ticket ${ticketId}`);
  }

  @SubscribeMessage('support:typingComment')
  handleTypingComment(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { ticketId: string; isTyping: boolean }
  ) {
    const { ticketId, isTyping } = data;

    // Broadcast typing indicator to other users in the ticket room
    socket.to(`ticket:${ticketId}`).emit('support:userTyping', {
      userId: socket.userId,
      ticketId,
      isTyping,
      timestamp: new Date(),
    });
  }

  /**
   * Server Status Events
   */

  @SubscribeMessage('server:subscribeStatus')
  handleSubscribeServerStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { serverUuid: string }
  ) {
    try {
      const { serverUuid } = data;

      // Join server-specific room
      socket.join(`server:${serverUuid}`);
      socket.emit('server:subscribed', { serverUuid, timestamp: new Date() });

      this.logger.log(`User ${socket.userId} subscribed to server ${serverUuid}`);
    } catch (error) {
      socket.emit('error', { message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  @SubscribeMessage('server:unsubscribeStatus')
  handleUnsubscribeServerStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { serverUuid: string }
  ) {
    const { serverUuid } = data;
    socket.leave(`server:${serverUuid}`);
    socket.emit('server:unsubscribed', { serverUuid, timestamp: new Date() });
    this.logger.log(`User ${socket.userId} unsubscribed from server ${serverUuid}`);
  }

  /**
   * Heartbeat - keep connection alive
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: Socket) {
    socket.emit('pong', { timestamp: new Date() });
  }

  /**
   * Broadcast Methods (called from services)
   */

  /**
   * Broadcast support ticket comment notification
   */
  broadcastTicketComment(ticketId: string, comment: any) {
    this.server.to(`ticket:${ticketId}`).emit('support:newComment', {
      ticketId,
      comment,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast support ticket status change
   */
  broadcastTicketStatusChange(ticketId: string, status: string, userId: string) {
    this.server.to(`ticket:${ticketId}`).emit('support:statusChanged', {
      ticketId,
      status,
      changedBy: userId,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast support ticket assignment
   */
  broadcastTicketAssignment(ticketId: string, assignedTo: string) {
    this.server.to(`ticket:${ticketId}`).emit('support:assigned', {
      ticketId,
      assignedTo,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast server status change
   */
  broadcastServerStatusChange(serverUuid: string, status: string, metrics?: any) {
    this.server.to(`server:${serverUuid}`).emit('server:statusChanged', {
      serverUuid,
      status,
      metrics,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast server metrics update
   */
  broadcastServerMetrics(serverUuid: string, metrics: any) {
    this.server.to(`server:${serverUuid}`).emit('server:metricsUpdate', {
      serverUuid,
      metrics,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast console output (for server console streaming)
   */
  broadcastConsoleOutput(serverUuid: string, output: string) {
    this.server.to(`server:${serverUuid}`).emit('server:consoleOutput', {
      serverUuid,
      output,
      timestamp: new Date(),
    });
  }

  /**
   * Send notification to specific user
   */
  sendUserNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }

  /**
   * Send notification to all support staff
   */
  broadcastToStaff(event: string, data: any) {
    this.server.to('role:ADMIN').emit(event, {
      ...data,
      timestamp: new Date(),
    });
    this.server.to('role:SUPPORT_STAFF').emit(event, {
      ...data,
      timestamp: new Date(),
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get user socket count
   */
  getUserSocketCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }
}
