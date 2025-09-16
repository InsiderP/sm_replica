import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Moment } from '../entities/moment.entity';
import { MomentLike } from '../entities/moment-like.entity';
import { MomentReply } from '../entities/moment-reply.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import { uploadToStorage } from '../common/providers/storage.provider';

@Injectable()
export class MomentService {
  constructor(
    @InjectRepository(Moment)
    private readonly momentRepository: Repository<Moment>,
    @InjectRepository(MomentReply)
    private readonly momentReplyRepository: Repository<MomentReply>,
    @InjectRepository(MomentLike)
    private readonly momentLikeRepository: Repository<MomentLike>,
  ) {}

  async createMultipleMoments(
    profile_id: string,
    files: any[],
    supabase: SupabaseClient,
    captions: string[],
    order: number[]
  ): Promise<Moment[]> {
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const moments: Moment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.originalname.split('.').pop();
      const filePath = `moments/${profile_id}/${Date.now()}_${i}.${ext}`;
      const media_url = await uploadToStorage(supabase, 'moments', filePath, file.buffer, true);
      const media_type = file.mimetype.startsWith('image') ? 'image' : 'video';
      const moment = this.momentRepository.create({
        profile_id,
        media_url,
        media_type,
        caption: captions[i], // undefined if not provided
        order: order[i] !== undefined ? order[i] : i, // use frontend order or fallback to index
        expires_at,
      });
      moments.push(moment);
    }
    const data= await this.momentRepository.save(moments);
    return data
  }


  async getUserMoments(profile_id: string): Promise<Moment[]> {
    return this.momentRepository.find({
      where: { profile_id, expires_at: MoreThan(new Date()) },
      order: { created_at: 'ASC', order: 'ASC' },
    });
  }

  async createMomentReply(moment_id: string, profile_id: string, text: string): Promise<MomentReply> {
    const moment = await this.momentRepository.findOne({ where: { id: moment_id } });
    if (!moment) throw new Error('Moment not found');
    const reply = this.momentReplyRepository.create({
      moment_id,
      profile_id,
      text,
      media_url: moment.media_url, // snapshot
      caption: moment.caption,     // snapshot
    });
    return this.momentReplyRepository.save(reply);
  }

  async likeMoment(moment_id: string, profile_id: string): Promise<{ success: boolean }> {
    // Prevent duplicate likes
    const existing = await this.momentLikeRepository.findOne({ where: { moment_id, profile_id } });
    if (existing) return { success: true };
    const moment = await this.momentRepository.findOne({ where: { id: moment_id } });
    if (!moment) throw new Error('Moment not found');
    await this.momentLikeRepository.save(this.momentLikeRepository.create({
      moment_id,
      profile_id,
      media_url: moment.media_url, // snapshot
      caption: moment.caption,     // snapshot
    }));
    return { success: true };
  }

  async unlikeMoment(moment_id: string, profile_id: string): Promise<{ success: boolean }> {
    await this.momentLikeRepository.delete({ moment_id, profile_id });
    return { success: true };
  }

} 