import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/entities/profile.entity';
import { Repository } from 'typeorm';


@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async findById(id: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { id } });
  }

  async updateProfile(id: string, dto: Partial<Profile>): Promise<Profile | null> {
    if (dto.userName) {
      const existing = await this.profileRepository.findOne({ where: { userName: dto.userName } });
      if (existing && existing.id !== id) {
        throw new Error('Username is already taken');
      }
    }
    await this.profileRepository.update(id, dto);
    return this.profileRepository.findOne({ where: { id } });
  }

  async setAccountPublicPrivate(id: string, is_public: boolean): Promise<Profile | null> {
    await this.profileRepository.update(id, { is_public });
    return this.profileRepository.findOne({ where: { id } });
  }

  async deactivateProfile(id: string): Promise<Profile | null> {
    await this.profileRepository.update(id, { is_active: false });
    return this.profileRepository.findOne({ where: { id } });
  }

  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
    isAvailable?: boolean,
  ): Promise<void> {
    const update: Partial<Profile> = {
      latitude,
      longitude,
      last_seen_at: new Date(),
    };
    if (typeof isAvailable === 'boolean') {
      update.is_available = isAvailable;
    }
    await this.profileRepository.update(id, update);
  }

  async findNearby(
    originLat: number,
    originLon: number,
    radiusKm: number,
    excludeProfileId?: string,
  ): Promise<Array<{ id: string; userName: string; avatarUrl?: string; distanceKm: number }>> {
    const earthRadiusKm = 6371;

    // Using raw SQL for Haversine; clamp inner value to [-1,1] for numerical stability
    const qb = this.profileRepository
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .addSelect('p.userName', 'userName')
      .addSelect('p.avatarUrl', 'avatarUrl')
      .addSelect(
        `${earthRadiusKm} * acos(least(1, greatest(-1, cos(radians(:olat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:olon)) + sin(radians(:olat)) * sin(radians(p.latitude)))))`,
        'distanceKm',
      )
      .where('p.latitude IS NOT NULL')
      .andWhere('p.longitude IS NOT NULL')
      .andWhere('p.is_available = true')
      .andWhere('p.is_public = true')
      .setParameters({ olat: originLat, olon: originLon })
      .orderBy('distanceKm', 'ASC');

    if (excludeProfileId) {
      qb.andWhere('p.id != :pid', { pid: excludeProfileId });
    }

    // Filter by radius using HAVING since distance is a computed select
    qb.having('distanceKm <= :radiusKm', { radiusKm });

    const rows = await qb.getRawMany<{
      id: string;
      userName: string;
      avatarUrl?: string;
      distancekm: number;
    }>();

    // getRawMany lowercases alias, map accordingly
    return rows.map(r => ({
      id: (r as any).id,
      userName: (r as any).username,
      avatarUrl: (r as any).avatarurl,
      distanceKm: Number((r as any).distancekm),
    }));
  }
} 