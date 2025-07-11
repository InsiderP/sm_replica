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
} 