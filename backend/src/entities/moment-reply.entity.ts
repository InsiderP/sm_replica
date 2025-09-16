import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Moment } from './moment.entity';
import { Profile } from './profile.entity';

@Entity('moment_replies')
export class MomentReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Moment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moment_id' })
  moment: Moment;

  @Column('uuid')
  moment_id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column('uuid')
  profile_id: string;

  @Column('text')
  text: string;

  @Column()
  media_url: string;//lower size image store and also another table

  @Column({ nullable: true })
  caption?: string;

  @CreateDateColumn()
  created_at: Date;
} 