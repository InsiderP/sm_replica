import { Controller, Post, Get, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { HangoutService } from './hangout.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { SendHangoutRequestDto } from './dto/send-hangout-request.dto';

@ApiTags('hangouts')
@Controller('hangouts')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class HangoutController {
  constructor(private readonly hangoutService: HangoutService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a hangout request to a nearby user' })
  async sendHangoutRequest(
    @CurrentUser() user: any,
    @Body() dto: SendHangoutRequestDto,
  ) {
    return this.hangoutService.sendHangoutRequest(user.id, dto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get all hangout requests (sent and received)' })
  async getHangoutRequests(@CurrentUser() user: any) {
    return this.hangoutService.getHangoutRequests(user.id);
  }

  @Post('respond/:requestId')
  @ApiOperation({ summary: 'Accept or decline a hangout request' })
  @ApiParam({ name: 'requestId', description: 'Hangout request ID' })
  async respondToHangoutRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
    @Body() body: { accept: boolean },
  ) {
    return this.hangoutService.respondToHangoutRequest(requestId, user.id, body.accept);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby available users for hangouts' })
  @ApiQuery({ name: 'radiusKm', required: false, example: 5, description: 'Search radius in kilometers' })
  async getNearbyAvailableUsers(
    @CurrentUser() user: any,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const radius = Number(radiusKm ?? 5);
    return this.hangoutService.getNearbyAvailableUsers(user.id, radius);
  }
}
