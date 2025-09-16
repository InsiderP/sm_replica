import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_media')
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, post => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column('uuid')
  post_id: string;

  @Column()
  media_type: 'image' | 'video';

  @Column()
  media_url: string;

  @Column({ type: 'int', default: 0 })
  order: number;
} 