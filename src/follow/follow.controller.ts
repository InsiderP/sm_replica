import { Controller, Post, Delete, Param, Get, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('follow')
@Controller('follow')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post(':target_profile_id')
  @ApiOperation({ summary: 'Send follow request or follow directly' })
  @ApiParam({ name: 'target_profile_id', description: 'Profile ID to follow' })
  async follow(@CurrentUser() user: any, @Param('target_profile_id') targetId: string) {
    return this.followService.follow(user.id, targetId);
  }

  @Post('accept/:request_id')
  @ApiOperation({ summary: 'Accept a follow request' })
  @ApiParam({ name: 'request_id', description: 'Follow request ID' })
  async accept(@CurrentUser() user: any, @Param('request_id') requestId: string) {
    console.log(requestId,user.id)
    return this.followService.acceptFollowRequest(user.id, requestId);
  }

  @Delete(':target_profile_id')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'target_profile_id', description: 'Profile ID to unfollow' })
  async unfollow(@CurrentUser() user: any, @Param('target_profile_id') targetId: string) {
    return this.followService.unfollow(user.id, targetId);
  }

  @Get('followers/:profile_id')
  @ApiOperation({ summary: 'Get followers of a user' })
  async getFollowers(@CurrentUser() user: any) {
    return this.followService.getFollowers(user.id);
  }

  @Get('following/:profile_id')
  @ApiOperation({ summary: 'Get users a profile is following' })
  async getFollowing(@CurrentUser() user: any) {
    return this.followService.getFollowing(user.id);
  }

  @Get('pending/:profile_id')
  @ApiOperation({ summary: 'Get pending follow requests for a user (private accounts)' })
  async getPendingRequests(@CurrentUser() user: any) {
    return this.followService.getPendingRequests(user.id);
  }
} 