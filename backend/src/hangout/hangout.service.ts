import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HangoutRequest, HangoutStatus } from '../entities/hangout-request.entity';
import { Profile } from '../entities/profile.entity';
import { SendHangoutRequestDto } from './dto/send-hangout-request.dto';
import { HangoutGateway } from './hangout.gateway';

@Injectable()
export class HangoutService {
  constructor(
    @InjectRepository(HangoutRequest)
    private readonly hangoutRepository: Repository<HangoutRequest>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @Inject(forwardRef(() => HangoutGateway))
    private readonly hangoutGateway: HangoutGateway,
  ) {}

  async sendHangoutRequest(fromUserId: string, dto: SendHangoutRequestDto) {
    // Get sender profile
    const fromProfile = await this.profileRepository.findOne({
      where: { id: fromUserId },
    });
    if (!fromProfile) {
      throw new NotFoundException('Sender profile not found');
    }

    // Check if target user exists and is available
    const targetProfile = await this.profileRepository.findOne({
      where: { id: dto.to_profile_id },
    });
    if (!targetProfile) {
      throw new NotFoundException('User not found');
    }
    if (!targetProfile.is_available) {
      throw new BadRequestException('User is not available for hangouts');
    }

    // Check if there's already a pending request
    const existingRequest = await this.hangoutRepository.findOne({
      where: {
        from_profile_id: fromUserId,
        to_profile_id: dto.to_profile_id,
        status: HangoutStatus.PENDING,
      },
    });
    if (existingRequest) {
      throw new BadRequestException('Hangout request already sent');
    }

    // Create hangout request (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const hangoutRequest = this.hangoutRepository.create({
      from_profile_id: fromUserId,
      to_profile_id: dto.to_profile_id,
      message: dto.message,
      expires_at: expiresAt,
    });

    const savedRequest = await this.hangoutRepository.save(hangoutRequest);

    // Send real-time notification
    try {
      await this.hangoutGateway.sendHangoutRequestNotification(
        dto.to_profile_id,
        fromProfile,
        savedRequest.id,
        dto.message,
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the request if notification fails
    }

    return savedRequest;
  }

  async getHangoutRequests(userId: string) {
    const [sent, received] = await Promise.all([
      this.hangoutRepository.find({
        where: { from_profile_id: userId },
        relations: ['toProfile'],
        order: { created_at: 'DESC' },
      }),
      this.hangoutRepository.find({
        where: { to_profile_id: userId },
        relations: ['fromProfile'],
        order: { created_at: 'DESC' },
      }),
    ]);

    return {
      sent: sent.map(req => ({
        id: req.id,
        to: {
          id: req.toProfile.id,
          userName: req.toProfile.userName,
          avatarUrl: req.toProfile.avatarUrl,
        },
        message: req.message,
        status: req.status,
        created_at: req.created_at,
        expires_at: req.expires_at,
      })),
      received: received.map(req => ({
        id: req.id,
        from: {
          id: req.fromProfile.id,
          userName: req.fromProfile.userName,
          avatarUrl: req.fromProfile.avatarUrl,
        },
        message: req.message,
        status: req.status,
        created_at: req.created_at,
        expires_at: req.expires_at,
      })),
    };
  }

  async respondToHangoutRequest(requestId: string, userId: string, accept: boolean) {
    const request = await this.hangoutRepository.findOne({
      where: { id: requestId, to_profile_id: userId },
      relations: ['fromProfile', 'toProfile'],
    });

    if (!request) {
      throw new NotFoundException('Hangout request not found');
    }

    if (request.status !== HangoutStatus.PENDING) {
      throw new BadRequestException('Request has already been responded to');
    }

    if (new Date() > request.expires_at) {
      request.status = HangoutStatus.EXPIRED;
      await this.hangoutRepository.save(request);
      throw new BadRequestException('Hangout request has expired');
    }

    request.status = accept ? HangoutStatus.ACCEPTED : HangoutStatus.DECLINED;
    await this.hangoutRepository.save(request);

    // Send real-time notification to the sender
    try {
      await this.hangoutGateway.sendHangoutResponseNotification(
        request.from_profile_id,
        request.toProfile,
        accept ? 'accepted' : 'declined',
        requestId,
      );
    } catch (error) {
      console.error('Failed to send response notification:', error);
      // Don't fail the response if notification fails
    }

    return {
      message: accept ? 'Hangout request accepted!' : 'Hangout request declined',
      request,
    };
  }

  async getNearbyAvailableUsers(userId: string, radiusKm: number = 5) {
    const userProfile = await this.profileRepository.findOne({
      where: { id: userId },
    });

    if (!userProfile || !userProfile.latitude || !userProfile.longitude) {
      return [];
    }

    const earthRadiusKm = 6371;
    const distanceExpr = `${earthRadiusKm} * acos(least(1, greatest(-1, cos(radians(:olat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:olon)) + sin(radians(:olat)) * sin(radians(p.latitude)))))`;

    const qb = this.profileRepository
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .addSelect('p.userName', 'userName')
      .addSelect('p.firstName', 'firstName')
      .addSelect('p.lastName', 'lastName')
      .addSelect('p.avatarUrl', 'avatarUrl')
      .addSelect('p.bio', 'bio')
      .addSelect('p.latitude', 'latitude')
      .addSelect('p.longitude', 'longitude')
      .addSelect(distanceExpr, 'distance_km')
      .where('p.latitude IS NOT NULL')
      .andWhere('p.longitude IS NOT NULL')
      .andWhere('p.is_available = true')
      .andWhere('p.is_public = true')
      .andWhere('p.id != :userId', { userId })
      .andWhere(`${distanceExpr} <= :radiusKm`, { radiusKm, olat: userProfile.latitude, olon: userProfile.longitude })
      .setParameters({ olat: userProfile.latitude, olon: userProfile.longitude })
      .orderBy('distance_km', 'ASC');

    const rows = await qb.getRawMany<{
      id: string;
      username: string;
      firstname: string;
      lastname: string;
      avatarurl?: string;
      bio?: string;
      latitude: number;
      longitude: number;
      distance_km?: number;
      distancekm?: number;
    }>();

    return rows.map((r: any) => ({
      id: r.id,
      userName: r.username || r.userName,
      firstName: r.firstname || r.firstName,
      lastName: r.lastname || r.lastName,
      avatarUrl: r.avatarurl || r.avatarUrl,
      bio: r.bio,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      distance_km: Number(r.distance_km ?? r.distancekm),
    }));
  }
}
