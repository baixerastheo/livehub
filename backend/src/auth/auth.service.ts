import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { ok, err } from 'neverthrow';
import { LoginDto } from './dto/login.dto.js';


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

    async login(loginDto: LoginDto) {
      const user = await this.usersService.GetUserByEmail(loginDto.login);
      if (user.isErr()) {
        return err('User not found');
      }
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.value.motDePasse);
      if (!isPasswordValid) {
        return err('Invalid password');
      }
      const tokens = this.generateTokens(user.value.id, user.value.email);
      return ok({
        user: user.value,
        access_token: tokens,
      });
    }

  logout() {
    return { message: 'Logged out successfully' };
  }
}
