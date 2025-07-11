import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
    @InjectRepository(Profile) private readonly profileRepo: Repository<Profile>,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException('Cannot follow yourself');
    const followingProfile = await this.profileRepo.findOne({ where: { id: followingId } });
    if (!followingProfile) throw new NotFoundException('User not found');

    const existing = await this.followRepo.findOne({ where: { follower_profile_id: followerId, following_profile_id: followingId } });
    if (existing) {
      if (existing.status === 'accepted') return { success: true, message: 'Already following' };
      if (existing.status === 'pending') return { success: true, message: 'Follow request already sent' };
    }

    const status = followingProfile.is_public ? 'accepted' : 'pending';
    await this.followRepo.save(this.followRepo.create({
      follower_profile_id: followerId,
      following_profile_id: followingId,
      status,
    }));

    // TODO: Send notification to followingId

    return { success: true, message: status === 'accepted' ? 'Now following' : 'Follow request sent' };
  }

  async acceptFollowRequest(profileId: string, requestId: string) {

    // profileId must be the profile being followed (following_profile_id)
    const request = await this.followRepo.findOne({ where: { id: requestId, following_profile_id: profileId, status: 'pending' } });
    if (!request) throw new NotFoundException('Request not found');
    request.status = 'accepted';
    await this.followRepo.save(request);

    // TODO: Send notification to request.follower_profile_id

    return { success: true, message: 'Follow request accepted' };
  }

  async unfollow(followerId: string, followingId: string) {
    await this.followRepo.delete({ follower_profile_id: followerId, following_profile_id: followingId });
    return { success: true, message: 'Unfollowed' };
  }

  async getFollowers(profileId: string) {
    return this.followRepo.find({ where: { following_profile_id: profileId, status: 'accepted' } });
  }

  async getFollowing(profileId: string) {
    return this.followRepo.find({ where: { follower_profile_id: profileId, status: 'accepted' } });
  }

  async getPendingRequests(profileId: string) {
    // For private accounts: see who wants to follow you
    return this.followRepo.find({ where: { following_profile_id: profileId, status: 'pending' } });
  }
} 