import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from './profile.entity';

export enum HangoutStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('hangout_requests')
export class HangoutRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_profile_id' })
  fromProfile: Profile;

  @Column('uuid')
  from_profile_id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_profile_id' })
  toProfile: Profile;

  @Column('uuid')
  to_profile_id: string;

  @Column({ type: 'enum', enum: HangoutStatus, default: HangoutStatus.PENDING })
  status: HangoutStatus;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
