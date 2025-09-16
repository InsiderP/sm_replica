import { Controller, Get, Param, Post, Body, Put, Patch, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { Profile } from 'src/entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadToStorage } from '../common/providers/storage.provider';
import { SUPABASE_CLIENT } from '../common/providers/supabase.provider';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Express } from 'express';
import { UpdateLocationDto } from './dto/update-location.dto';


@ApiTags('users')
@Controller('users')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getMe(@CurrentUser() user: any) {
    return this.profileService.findById(user.id);
  }
  
  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Partially update user profile (fields or avatar)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userName: { type: 'string', example: 'john_doe' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        bio: { type: 'string', example: 'My bio' },
        gender: { type: 'string', example: 'male' },
        dateOfBirth: { type: 'string', format: 'date', example: '2000-01-01' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  async partialUpdateProfile(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() dto: UpdateProfileDto
  ) {
    if (file) {
      const avatarUrl = await uploadToStorage(
        this.supabase,
        'avatars',
        `avatars/${id}/${Date.now()}_${file.originalname}`,
        file.buffer,
        true
      );
      dto.avatarUrl = avatarUrl;
    }
    // Remove undefined fields
    (Object.keys(dto) as (keyof UpdateProfileDto)[]).forEach(key => {
      if (dto[key] === undefined) delete dto[key];
    });
    return this.profileService.updateProfile(id, dto);
  }


  @Patch(':id/public')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Set account public or private' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async setAccountPublicPrivate(@Param('id') id: string, @Body() body: { is_public: boolean }) {
    return this.profileService.setAccountPublicPrivate(id, body.is_public);
  }

  @Patch(':id/deactivate')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Deactivate (soft delete) user account' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async deactivateProfile(@Param('id') id: string) {
    return this.profileService.deactivateProfile(id);
  }

  @Patch('me/location')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update current user location and availability' })
  async updateMyLocation(
    @CurrentUser() user: any,
    @Body() dto: UpdateLocationDto,
  ) {
    await this.profileService.updateLocation(
      user.id,
      dto.latitude,
      dto.longitude,
      dto.is_available,
    );
    return { success: true };
  }

  @Get('nearby')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get nearby available public users within given radius (km)' })
  @ApiQuery({ name: 'radiusKm', required: false, example: 5, description: 'Search radius in kilometers' })
  async getNearby(
    @CurrentUser() user: any,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const radius = Number(radiusKm ?? 5);
    const me = await this.profileService.findById(user.id);
    if (!me || me.latitude == null || me.longitude == null) {
      return [];
    }
    return this.profileService.findNearby(me.latitude, me.longitude, radius, user.id);
  }

} 