import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './authGuard/jwt-auth.guard.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives. Réessayez plus tard.',
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.Register(registerDto);
    if (result.isErr()) {
      throw new BadRequestException(result.error);
    }
    const { user, access_token } = result.value;
    res.cookie('access_token', access_token, {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
      httpOnly: false,
    });
    return { user, access_token };
  }

  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    if (result.isErr()) {
      throw new UnauthorizedException(result.error);
    }
    const { user, access_token } = result.value;
    res.cookie('access_token', access_token, {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
      httpOnly: false,
    });
    return { user, access_token };
  }

  @ApiOperation({ summary: 'Refresh token from cookie' })
  @ApiResponse({ status: 200, description: 'Token returned' })
  @ApiResponse({ status: 401, description: 'No token in cookie' })
  @Post('refresh')
  refresh(@Req() req: { cookies?: { access_token?: string } }) {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException('No token in cookie');
    }
    return { access_token: token };
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    return this.authService.logout();
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  GetProfile(
    @Req() req: { user: { nomUtilisateur: string; [k: string]: unknown } },
  ) {
    const user = req.user;
    return {
      message: 'Profile retrieved successfully',
      user: { ...user, username: user.nomUtilisateur },
    };
  }
}
