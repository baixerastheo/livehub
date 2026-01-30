import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import type { Request as ExpressRequest, Response } from 'express';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LocalAuthGuard } from './authGuard/local-auth.guard.js';
import { JwtAuthGuard } from './authGuard/jwt-auth.guard.js';
import type { Result } from '../result.js';
import type { AuthenticatedUser } from './types.js';
import { getRefreshTokenSameSite } from './auth.config.js';

type RequestWithUser = ExpressRequest & { user: AuthenticatedUser };
type RequestWithCookies = Omit<ExpressRequest, 'cookies'> & {
  cookies?: Record<string, string>;
};

const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function getRefreshTokenMaxAgeMs(): number {
  return (
    parseInt(process.env.JWT_REFRESH_MAX_AGE_MS ?? '', 10) ||
    7 * 24 * 60 * 60 * 1000
  );
}

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const maxAge = getRefreshTokenMaxAgeMs();
  const sameSite = getRefreshTokenSameSite();

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    maxAge,
    path: '/',
  });

  const csrfToken = randomBytes(32).toString('hex');

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    maxAge,
    path: '/',
  });
}

function clearRefreshTokenCookie(res: Response): void {
  const sameSite = getRefreshTokenSameSite();

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    maxAge: 0,
    path: '/',
  });

  res.cookie(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    maxAge: 0,
    path: '/',
  });
}

function assertValidCsrf(req: RequestWithCookies): void {
  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME] ?? '';
  // Use Express' typed accessor to avoid `any` headers indexing.
  const csrfHeader = req.get(CSRF_HEADER_NAME) ?? '';

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new ForbiddenException('Invalid CSRF token');
  }
}

function unwrapOrThrowBadRequest<T>(result: Result<T, string>): T {
  if (result.isErr()) {
    throw new BadRequestException(result.error);
  }

  return result.unwrapOr(null as never);
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const result = await this.authService.register(dto);

    const tokens = unwrapOrThrowBadRequest(result);

    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Body() _dto: LoginDto,
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): { accessToken: string } {
    const tokens = this.authService.login(req.user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  async refresh(
    @Request() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    assertValidCsrf(req);

    const refreshToken: string = req.cookies?.refresh_token ?? '';

    const result = await this.authService.refreshTokens(refreshToken);

    const tokens = unwrapOrThrowBadRequest(result);

    setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  profile(@Request() req: RequestWithUser): {
    id: number;
    email: string;
    username: string;
  } {
    return {
      id: req.user.id,
      email: req.user.email,
      username: req.user.nomUtilisateur,
    };
  }

  @Post('logout')
  logout(
    @Request() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): void {
    assertValidCsrf(req);
    clearRefreshTokenCookie(res);
    this.authService.logout();
  }
}
