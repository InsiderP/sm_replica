import { Controller, Post, Body, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpAndCreateDto } from './dto/verify-otp-and-create.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot/reset password' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('google-url')
  @ApiOperation({ summary: 'Get Google OAuth URL for signup/login' })
  @ApiBody({ schema: { example: { redirectTo: "https://1829-205-254-167-213.ngrok-free.app/v1/auth/callback"}}})// this url and redirect url of superbase should be match 
  async getGoogleUrl(@Body() body: { redirectTo: string }) {
    return this.authService.getGoogleOAuthUrl(body.redirectTo);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  async googleCallback(@Query('code') code: string) {
    return this.authService.exchangeCodeForSession(code);
  }

  @Post('start-signup')
  @ApiOperation({ summary: 'Start signup, send OTP to phone, and return signupToken' })
  async startSignup(@Body() dto: CompleteSignupDto) {
    return this.authService.startSignup(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and create user/profile' })
  async verifyOtpAndCreate(@Body() dto: VerifyOtpAndCreateDto) {
    return this.authService.verifyOtpAndCreate(dto);
  }

  @Post('update-password')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update password for logged-in user' })
  async updatePassword(@CurrentUser() user: any, @Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(user, dto.oldPassword, dto.newPassword);
  }
} 