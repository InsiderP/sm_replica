import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from '../common/providers/supabase.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { VerifyOtpAndCreateDto } from './dto/verify-otp-and-create.dto';
import * as jwt from 'jsonwebtoken';


const SIGNUP_JWT_SECRET = process.env.SIGNUP_JWT_SECRET || 'signup_secret';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private config: ConfigService,
    @InjectRepository(Profile) private readonly profileRepo: Repository<Profile>,
  ) {}

  // Get Google OAuth URL for signup/login
  async getGoogleOAuthUrl(redirectTo: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new BadRequestException(error.message);
    return { url: data.url };
  }

  async exchangeCodeForSession(code: string) {
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);
    if (error) throw new BadRequestException(error.message);

    // Map Supabase user data to Profile entity fields
    const user = data.user;
    const userMeta = user.user_metadata || {};
    let firstName = '';
    let lastName = '';
    if (userMeta.full_name) {
      const nameParts = userMeta.full_name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    const profile = this.profileRepo.create({
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      avatarUrl: userMeta.avatar_url || '',
    });
    await this.profileRepo.save(profile);

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    };
  }


  async startSignup(details: CompleteSignupDto) {
    // Validate username/email uniqueness
    const existing = await this.profileRepo.findOne({ where: { userName: details.userName } });
    if (existing) throw new BadRequestException('Username is already taken');

    const existingPhone = await this.profileRepo.findOne({ where: { phone: details.phone } });
    if (existingPhone) throw new BadRequestException('phone already exist');
    const existingEmail = await this.profileRepo.findOne({ where: { email: details.email } });
    if (existingEmail) throw new BadRequestException('email already exist');

    // Send OTP to phone
    const { error } = await this.supabase.auth.signInWithOtp({ phone: details.phone });
    if (error) throw new BadRequestException(error.message);

    // Create a JWT with the signup details (except password)
    const { ...payload } = details;
    const signupToken = jwt.sign(payload, SIGNUP_JWT_SECRET, { expiresIn: '10m' });

    return { message: 'OTP sent', signupToken };
  }

  async verifyOtpAndCreate(dto: VerifyOtpAndCreateDto) {
  
    let details: any;
    try {
      details = jwt.verify(dto.signupToken, SIGNUP_JWT_SECRET);
    } catch (e) {
      throw new BadRequestException('Invalid or expired signup token');
    }

    // Verify OTP
    const { data, error } = await this.supabase.auth.verifyOtp({ phone: details.phone, token: dto.otp, type: 'sms' });
    if (error) throw new BadRequestException(error.message);


    // Find user by phone
     const { data: users } = await this.supabase.auth.admin.listUsers();
     const normalizedPhone = details.phone.replace(/^\+/, '');
     const existingUser = users?.users?.find(u => u.phone === normalizedPhone)

    if (existingUser) {
  // Update email and password
  const { data: updatedUser, error: updateError } = await this.supabase.auth.admin.updateUserById(existingUser.id, {
    email: details.email,
    password: details.password,
    email_confirm: true,
  })
  
  
  if (updateError) throw new BadRequestException(updateError.message);

    

    
    const profile = this.profileRepo.create({
      id: updatedUser?.user?.id,
      firstName: details.firstName,
      lastName: details.lastName,
      gender: details.gender,
      email: details.email,
      phone: details.phone,
      userName: details.userName,
      avatarUrl:details.avatarUrl,
      is_public:details.is_public
    });
    await this.profileRepo.save(profile);
   
    return { message: 'Signup complete', user: updatedUser.user, profile };
  }
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw new BadRequestException(error.message);
    // Active and Inactive profile Logic
    const profile = await this.profileRepo.findOne({ where: { id: data.user.id } });
    if (!profile) throw new BadRequestException('Profile not found');
    if (!profile.is_active) throw new BadRequestException('Account is inactive. Please contact support.');
    return { access_token: data.session.access_token, user: data.user, profile };
  }


  async forgotPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Password reset email sent' };
  }

  async updatePassword(user: any, oldPassword: string, newPassword: string) {
    // 1. Verify old password
    const { data, error } = await this.supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
    if (error) throw new BadRequestException('Old password is incorrect');
    // 2. Update to new password
    const { error: updateError } = await this.supabase.auth.updateUser({ password: newPassword }, user.access_token);
    if (updateError) throw new BadRequestException(updateError.message);
    return { message: 'Password updated successfully' };
  }
} 