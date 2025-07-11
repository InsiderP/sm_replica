import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Inject, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { SUPABASE_CLIENT } from '../common/providers/supabase.provider';
import { SupabaseClient } from '@supabase/supabase-js';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('posts')
@Controller('posts')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PostController {
  constructor(
    private readonly postService: PostService,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new carousel post (multiple images/videos with one caption)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        tagged_usernames: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  @UseInterceptors(FilesInterceptor('files'))
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: any[],
    @CurrentUser() user: any
  ) {
    return this.postService.createPost(createPostDto, files, this.supabase, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID, including its media array' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async getPostById(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all posts with their media arrays' })
  async getAllPosts() {
    return this.postService.getAllPosts();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post (caption, tagged_usernames, media)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        tagged_usernames: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'string', format: 'binary' } }
      }
    }
  })
  @UseInterceptors(FilesInterceptor('files'))
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: CreatePostDto,
    @UploadedFiles() files: any[],
    @CurrentUser() user: any
  ) {
    return this.postService.updatePost(id, updatePostDto, files, this.supabase, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async deletePost(@Param('id') id: string) {
    return this.postService.deletePost(id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async likePost(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.postService.likePost(id, user.id);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  async unlikePost(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.postService.unlikePost(id, user.id);
  }
} 