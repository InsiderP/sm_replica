import { Controller, Post, Body, Param, Delete, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SUPABASE_CLIENT } from '../common/providers/supabase.provider';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { CommentService } from './comment.service';

@ApiTags('comments')
@Controller('comments')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Post('/post/:postId')
  @ApiOperation({ summary: 'Create a comment or reply on a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: CreateCommentDto })
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any
  ) {
    return this.commentService.createComment(postId, dto, user.id);
  }

  @Get('/post/:postId')
  @ApiOperation({ summary: 'Get all comments (with replies) for a post' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  async getCommentsForPost(@Param('postId') postId: string, @CurrentUser() user: any) {
    return this.commentService.getCommentsForPost(postId, user.id);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a comment (and its replies)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async deleteComment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentService.deleteComment(id, user.id);
  }

  @Post('/:id/like')
  @ApiOperation({ summary: 'Like a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async likeComment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentService.likeComment(id, user.id);
  }

  @Delete('/:id/unlike')
  @ApiOperation({ summary: 'Unlike a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  async unlikeComment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentService.unlikeComment(id, user.id);
  }
} 