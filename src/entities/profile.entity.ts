import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Post } from './post.entity';
import { Like } from './like.entity';
import { Follow } from './follow.entity';


@Entity({ name: 'profiles', schema: 'public' })
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true})
  email: string;
   
  @Column({ unique: true })
  phone: string;

  @Column({ unique: true, length: 50 })
  userName: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ length: 10, nullable: true })
  gender?: string;

  @Column({ length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'int', default: 0 })
  followersCount: number;

  @Column({ type: 'int', default: 0 })
  followingCount: number;

  @Column({ type: 'int', default: 0 })
  postsCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Post, post => post.profile)
  posts: Post[];

  @OneToMany(() => Like, like => like.profile)
  likes: Like[];

  

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  is_public: boolean;


  @OneToMany(() => Follow, follow => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, follow => follow.following)
  followers: Follow[];
} 