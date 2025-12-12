import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '@zed-hosting/db';

@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Configure properly for production
  },
  namespace: '/console',
})
export class ConsoleGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    // TODO: Implement JWT authentication for WebSocket connections
    // For now, allow connection
    console.log(`Console client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Console client disconnected: ${client.id}`);
  }

  @SubscribeMessage('connect-server')
  async handleConnectServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { serverUuid: string; userId: string },
  ) {
    try {
      // Verify user has access to this server
      const server = await this.prisma.gameServer.findUnique({
        where: { uuid: data.serverUuid },
      });

      if (!server || server.ownerId !== data.userId) {
        client.emit('error', { message: 'Access denied' });
        return;
      }

      // Join room for this server
      client.join(`server:${data.serverUuid}`);

      // TODO: Connect to daemon and start Docker exec session
      // For now, send mock data
      client.emit('connected', {
        serverUuid: data.serverUuid,
        message: 'Connected to server console',
      });

      // Send initial console output
      client.emit('output', {
        type: 'stdout',
        data: 'Console connected. Waiting for daemon connection...\n',
      });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to connect to server console',
      });
    }
  }

  @SubscribeMessage('input')
  async handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { serverUuid: string; input: string },
  ) {
    try {
      // TODO: Forward input to daemon/Docker exec
      // For now, echo back
      client.emit('output', {
        type: 'stdout',
        data: `Received: ${data.input}\n`,
      });
    } catch (error) {
      client.emit('error', {
        message: 'Failed to send input',
      });
    }
  }

  @SubscribeMessage('resize')
  async handleResize(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { serverUuid: string; cols: number; rows: number },
  ) {
    try {
      // TODO: Send resize to daemon/Docker exec
      console.log(`Resize request: ${data.cols}x${data.rows}`);
    } catch (error) {
      client.emit('error', {
        message: 'Failed to resize terminal',
      });
    }
  }
}

