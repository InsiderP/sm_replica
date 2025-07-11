import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique, JoinColumn } from 'typeorm';
import { Moment } from './moment.entity';
import { Profile } from './profile.entity';

@Entity('moment_likes')
@Unique(['moment_id', 'profile_id'])
export class MomentLike {
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

  @Column()
  media_url: string;

  @Column({ nullable: true })
  caption?: string;

  @CreateDateColumn()
  created_at: Date;
} 