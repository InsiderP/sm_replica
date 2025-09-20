import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/user.decorator';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/providers/supabase.provider';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/hangouts',
})
export class HangoutGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('HangoutGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Extract token from handshake
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      this.logger.warn(`Client ${client.id} connected without token`);
      client.disconnect();
      return;
    }

    try {
      // Verify token and get user info
      // This would typically involve calling your auth service
      // For now, we'll assume the token is valid and extract user ID
      const userId = await this.getUserIdFromToken(token);
      
      if (userId) {
        this.userSockets.set(userId, client.id);
        client.join(`user_${userId}`);
        this.logger.log(`User ${userId} connected with socket ${client.id}`);
        
        // Send connection confirmation
        client.emit('connected', { message: 'Connected to hangout notifications' });
      } else {
        this.logger.warn(`Invalid token for client ${client.id}`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Authentication error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove user from map
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('join_user_room')
  async handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined room user_${userId}`);
  }

  @SubscribeMessage('leave_user_room')
  async handleLeaveUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    client.leave(`user_${userId}`);
    this.logger.log(`Client ${client.id} left room user_${userId}`);
  }

  // Method to send hangout request notification
  async sendHangoutRequestNotification(toUserId: string, fromUser: any, requestId: string, message?: string) {
    const room = `user_${toUserId}`;
    this.server.to(room).emit('hangout_request', {
      type: 'hangout_request',
      requestId,
      fromUser: {
        id: fromUser.id,
        userName: fromUser.userName,
        avatarUrl: fromUser.avatarUrl,
        firstName: fromUser.firstName,
        lastName: fromUser.lastName,
      },
      message: message || `${fromUser.userName} wants to hang out with you!`,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Sent hangout request notification to user ${toUserId}`);
  }

  // Method to send hangout response notification
  async sendHangoutResponseNotification(toUserId: string, fromUser: any, status: string, requestId: string) {
    const room = `user_${toUserId}`;
    this.server.to(room).emit('hangout_response', {
      type: 'hangout_response',
      requestId,
      fromUser: {
        id: fromUser.id,
        userName: fromUser.userName,
        avatarUrl: fromUser.avatarUrl,
      },
      status,
      message: `${fromUser.userName} ${status} your hangout request!`,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Sent hangout response notification to user ${toUserId}`);
  }

  // Method to send location update notification
  async sendLocationUpdateNotification(userId: string, nearbyUsers: any[]) {
    const room = `user_${userId}`;
    this.server.to(room).emit('location_update', {
      type: 'location_update',
      nearbyUsers: nearbyUsers.map(user => ({
        id: user.id,
        userName: user.userName,
        avatarUrl: user.avatarUrl,
        distanceKm: user.distanceKm,
        latitude: user.latitude,
        longitude: user.longitude,
      })),
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Sent location update notification to user ${userId}`);
  }

  private async getUserIdFromToken(token: string): Promise<string | null> {
    try {
      // Use Supabase to verify the token and get user info
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        this.logger.error('Error verifying token:', error);
        return null;
      }
      
      return user.id;
    } catch (error) {
      this.logger.error('Error verifying token:', error);
      return null;
    }
  }
}
