import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Post } from './post.entity';
import { Profile } from './profile.entity';

@Entity('comments')
export class Comment {
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

  @Column('text')
  text: string;

  @ManyToOne(() => Comment, comment => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_comment_id' })
  parent: Comment;

  @Column('uuid', { nullable: true })
  parent_comment_id: string | null;

  @OneToMany(() => Comment, comment => comment.parent)
  replies: Comment[];

  @CreateDateColumn()
  created_at: Date;
} 