import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { Post } from './post.entity';

@Entity('likes')
@Unique(['post_id', 'profile_id'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column('uuid')
  post_id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column('uuid')
  profile_id: string;

  @CreateDateColumn()
  created_at: Date;
} 