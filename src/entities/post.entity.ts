import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany
} from 'typeorm';
import { Profile } from './profile.entity';
import { PostMedia } from './post-media.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column('uuid')
  profile_id: string; // Foreign key to Profile.id

  @Column({ nullable: true })
  caption: string;

  @Column('simple-array', { nullable: true })
  tagged_usernames: string[]; // usernames of tagged friends

  @Column({ default: 0 })
  likes_count: number;

  @Column({ default: 0 })
  comments_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PostMedia, media => media.post, { cascade: true })
  media: PostMedia[];
} 