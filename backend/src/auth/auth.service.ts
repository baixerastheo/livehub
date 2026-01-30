import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { Result, ok, err } from '../result.js';
import { LoginDto } from './dto/login.dto.js';
import type { AuthenticatedUser } from './types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,private readonly jwtService: JwtService,) {}
    
    async Register(registerDto: RegisterDto) {
      const emailExist = await this.usersService.GetUserByEmail(registerDto.email);
      if (emailExist.isOk()) {
        return err('Email already used');
      }
      const user = await this.usersService.createUser({
        nomUtilisateur: registerDto.username,
        email: registerDto.email,
        motDePasse: await bcrypt.hash(registerDto.password, 10),
      });
      if (user.isErr()) {
        return err(user.error);
      }

      const createdUser = user.unwrapOr(null as never);
      const { motDePasse: _password, ...userWithoutPassword } = createdUser;
      const tokens = this.generateTokens(createdUser.id, createdUser.email);

      return ok({
        user: { ...userWithoutPassword, username: userWithoutPassword.nomUtilisateur },
        access_token: tokens,
      });
    }

    private generateTokens(userId: number, userEmail: string): string{
      const payload = { sub: userId, email: userEmail };
      return this.jwtService.sign(payload) 
    }

    async validateUser(login: string, password: string): Promise<Result<AuthenticatedUser, string>> {
      const trimmed = login.trim();
      const isEmail = trimmed.includes('@');
      const user = isEmail
        ? await this.usersService.GetUserByEmail(trimmed)
        : await this.usersService.GetUserByUsername(trimmed);
      if (user.isErr()) {
        return err('User not found');
      }
      const isPasswordValid = await bcrypt.compare(password, user.value.motDePasse);
      if (!isPasswordValid) {
        return err('Invalid password');
      }
      const { motDePasse: _password, ...userWithoutPassword } = user.value;
      return ok(userWithoutPassword);
    }

    async login(loginDto: LoginDto) {
      const result = await this.validateUser(loginDto.login, loginDto.password);
      if (result.isErr()) {
        return err(result.error);
      }
      const userWithoutPassword = result.unwrapOr(null as never);
      const tokens = this.generateTokens(userWithoutPassword.id, userWithoutPassword.email);
      return ok({
        user: { ...userWithoutPassword, username: userWithoutPassword.nomUtilisateur },
        access_token: tokens,
      });
    }

  async logout() {
    return { message: 'Logged out successfully' };
  }
}
