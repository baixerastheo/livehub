import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Utilisateur as User } from '../../generated/prisma/client.js';
import type { AuthenticatedUser } from './types.js';
import {
  getJwtAccessSecret,
  getJwtAccessExpiresIn,
  getJwtRefreshSecret,
  getJwtRefreshExpiresIn,
} from './auth.config.js';
import { UserService } from '../user/user.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { Result, ok, err } from '../result.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    login: string,
    password: string,
  ): Promise<Result<Omit<User, 'motDePasse'>, string>> {
    const emailResult = await this.findUserByEmail(login);

    const userResult = emailResult.isOk()
      ? emailResult
      : await this.findUserByUsername(login);

    if (userResult.isErr()) {
      return err('Invalid credentials');
    }

    const user = userResult.unwrapOr(null as never);

    const passwordResult = await this.validatePassword(
      password,
      user.motDePasse,
    );

    return passwordResult
      .map(() => {
        const { motDePasse: _password, ...result } = user;
        return result;
      })
      .mapErr(() => 'Invalid password');
  }

  private async findUserByEmail(login: string): Promise<Result<User, string>> {
    return this.usersService.GetUserByEmail(login);
  }

  private async findUserByUsername(
    login: string,
  ): Promise<Result<User, string>> {
    return this.usersService.GetUserByUsername(login);
  }

  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<Result<boolean, string>> {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      return isValid ? ok(true) : err('Invalid password');
    } catch {
      return err('Password validation failed');
    }
  }

  private getAccessToken(user: AuthenticatedUser): string {
    const payload = { sub: user.id, email: user.email, status: user.statut };
    return this.jwtService.sign(payload, {
      secret: getJwtAccessSecret(),
      expiresIn: getJwtAccessExpiresIn(),
    });
  }

  private getRefreshToken(user: AuthenticatedUser): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload, {
      secret: getJwtRefreshSecret(),
      expiresIn: getJwtRefreshExpiresIn(),
    });
  }

  login(user: AuthenticatedUser): { accessToken: string; refreshToken: string } {
    const accessToken = this.getAccessToken(user);
    const refreshToken = this.getRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<Result<{ accessToken: string; refreshToken: string }, string>> {
    const createResult = await this.usersService.createUser({
      nomUtilisateur: registerDto.username,
      email: registerDto.email,
      motDePasse: await bcrypt.hash(registerDto.password, 10),
    });

    if (createResult.isErr()) {
      return err(createResult.error);
    }

    const user = createResult.unwrapOr(null as never);
    const tokens = this.login(user);
    return ok(tokens);
  }

  async profile(user: {
    id: number;
  }): Promise<Result<Omit<User, 'motDePasse'>, string>> {
    const findResult = await this.usersService.getUserById(user.id);
    if (findResult.isErr()) {
      return err(findResult.error);
    }
    const fullUser = findResult.unwrapOr(null as never);
    const { motDePasse: _password, ...userWithoutPassword } = fullUser;
    return ok(userWithoutPassword);
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<Result<{ accessToken: string; refreshToken: string }, string>> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
      }>(refreshToken, {
        secret: getJwtRefreshSecret(),
      });

      const userResult = await this.usersService.getUserById(payload.sub);
      if (userResult.isErr()) {
        return err('User not found');
      }

      const user = userResult.unwrapOr(null as never);
      const tokens = this.login(user);
      return ok(tokens);
    } catch {
      return err('Invalid or expired refresh token');
    }
  }

  logout(): void {
    return;
  }
}
