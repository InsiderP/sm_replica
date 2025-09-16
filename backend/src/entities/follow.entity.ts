import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from './profile.entity';

@Entity('follows')
@Unique(['follower_profile_id', 'following_profile_id'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, profile => profile.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_profile_id' })
  follower: Profile;

  @Column('uuid')
  follower_profile_id: string;

  @ManyToOne(() => Profile, profile => profile.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_profile_id' })
  following: Profile;

  @Column('uuid')
  following_profile_id: string;

  @Column({ type: 'enum', enum: ['pending', 'accepted'], default: 'accepted' })
  status: 'pending' | 'accepted';

  @CreateDateColumn()
  created_at: Date;
} 