import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getUserSessions(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const currentSessionId = this.extractSessionId(req);
    return this.sessionsService.getUserSessions(userId, currentSessionId);
  }

  @Delete(':sessionId')
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.sessionsService.revokeSession(userId, sessionId);
  }

  @Post('revoke-all')
  async revokeAllOtherSessions(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const currentSessionId = this.extractSessionId(req);
    return this.sessionsService.revokeAllOtherSessions(userId, currentSessionId);
  }

  private extractSessionId(req: Request): string {
    // Extract session ID from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    return token || '';
  }
}
