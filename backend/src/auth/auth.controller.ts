import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest, Response } from 'express';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LocalAuthGuard } from './authGuard/local-auth.guard.js';
import { JwtAuthGuard } from './authGuard/jwt-auth.guard.js';
import { Result, ok } from '../result.js';
import type { Utilisateur as User } from '../../generated/prisma/client.js';

type RequestWithUser = ExpressRequest & { user: User };
type RequestWithCookies = ExpressRequest & { cookies?: Record<string, string> };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Result<{ accessToken: string }, string>> {
    const result = await this.authService.register(dto);

    if (result.isErr()) {
      return result;
    }

    const tokens = result.unwrapOr(null as never);

    const refreshTokenMaxAge =
      parseInt(process.env.JWT_REFRESH_MAX_AGE_MS ?? '', 10) ||
      7 * 24 * 60 * 60 * 1000;

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    return ok({ accessToken: tokens.accessToken });
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Body() _dto: LoginDto,
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): { accessToken: string } {
    const tokens = this.authService.login(req.user);

    const refreshTokenMaxAge =
      parseInt(process.env.JWT_REFRESH_MAX_AGE_MS ?? '', 10) ||
      7 * 24 * 60 * 60 * 1000;

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
      path: '/',
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  async refresh(
    @Request() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Result<{ accessToken: string }, string>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string = req.cookies?.refresh_token ?? '';

    const result = await this.authService.refreshTokens(refreshToken);

    if (result.isErr()) {
      return result;
    }

    const refreshTokenMaxAge =
      parseInt(process.env.JWT_REFRESH_MAX_AGE_MS ?? '', 10) ||
      7 * 24 * 60 * 60 * 1000;

    return result.map((tokens) => {
      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshTokenMaxAge,
        path: '/',
      });

      return { accessToken: tokens.accessToken };
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Request() req: RequestWithUser) {
    return this.authService.profile({ id: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): void {
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    this.authService.logout();
  }
}
