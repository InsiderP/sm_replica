import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Profile } from './profile.entity';

@Entity('moments')
export class Moment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column('uuid')
  profile_id: string;

  @Column()
  media_type: 'image' | 'video';

  @Column()
  media_url: string;

  @Column({ type: 'int', nullable: true })
  order?: number;

  @Column({ nullable: true })
  caption?: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;
} 