import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { Profile } from './profile.entity';

@Entity('comment_likes')
@Unique(['comment_id', 'profile_id'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column('uuid')
  comment_id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column('uuid')
  profile_id: string;

  @CreateDateColumn()
  created_at: Date;
} 