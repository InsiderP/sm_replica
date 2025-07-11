import { Controller, Post, Get, Delete, Param, Body, UploadedFiles, UseInterceptors, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MomentService } from './moment.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { uploadToStorage } from '../common/providers/storage.provider';
import { SUPABASE_CLIENT } from '../common/providers/supabase.provider';
import { SupabaseClient } from '@supabase/supabase-js';
import { Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../auth/user.decorator';
import { ApiProperty } from '@nestjs/swagger';


@ApiTags('moments')
@Controller('moments')
@ApiBearerAuth()
export class MomentController {
  constructor(
    private readonly momentService: MomentService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create one or more moments (stories) with images/videos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        captions: { type: 'array', items: { type: 'string' } },
        order: { type: 'array', items: { type: 'number' } },
        media: { type: 'array', items: { type: 'string', format: 'binary' } }
      },
      required: ['media']
    }
  })
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('media'))
  async createMultipleMoments(
    @Body() body: CreateMomentDto,
    @UploadedFiles() files: any[],
    @CurrentUser() user: any,
  ) {
    const profile_id = user.id;
    if (!profile_id) throw new BadRequestException('Missing profile_id in authenticated user');
    if (!files || files.length === 0) throw new BadRequestException('No media files uploaded');

    // Normalize arrays
    const captions = body.captions && Array.isArray(body.captions) ? body.captions : [];
    const order = body.order && Array.isArray(body.order) ? body.order : [];

    return this.momentService.createMultipleMoments(profile_id, files, this.supabase, captions, order);
  }


  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all active moments for the current user' })
  async getMyMoments(@CurrentUser() user: any) {
    return this.momentService.getUserMoments(user.id);
  }

  @Get(':profile_id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all active moments for a specific user' })
  @ApiParam({ name: 'profile_id', description: 'User profile ID' })
  async getUserMoments(@Param('profile_id') profile_id: string) {
    return this.momentService.getUserMoments(profile_id);
  }

  @Post(':moment_id/reply')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Reply to a moment (with snapshot)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Reply text' }
      },
      required: ['text']
    }
  })
  async createMomentReply(
    @Param('moment_id') moment_id: string,
    @Body() body: { text: string },
    @CurrentUser() user: any,
  ) {
    if (!body.text) throw new BadRequestException('Reply text is required');
    return this.momentService.createMomentReply(moment_id, user.id, body.text);
  }

  @Post(':moment_id/like')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Like a moment' })
  @ApiParam({ name: 'moment_id', description: 'Moment ID' })
  async likeMoment(
    @Param('moment_id') moment_id: string,
    @CurrentUser() user: any,
  ) {
    return this.momentService.likeMoment(moment_id, user.id);
  }

  @Delete(':moment_id/like')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Unlike a moment' })
  @ApiParam({ name: 'moment_id', description: 'Moment ID' })
  async unlikeMoment(
    @Param('moment_id') moment_id: string,
    @CurrentUser() user: any,
  ) {
    return this.momentService.unlikeMoment(moment_id, user.id);
  }


} 