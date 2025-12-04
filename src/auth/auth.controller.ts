import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// DTOs for type safety and clarity
class LoginDto {
  // FIX: Add initializer to DTO properties to satisfy TS compiler
  username: string = '';
  password: string = '';
}

class RegisterDto {
  // FIX: Add initializer to DTO properties
  username: string = '';
  password: string = '';
}

class RefreshTokenDto {
  // FIX: Add initializer to DTO properties
  refreshToken: string = '';
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    if (!body || !body.username || !body.password) {
        throw new BadRequestException('Username and password are required');
    }
    // Creation is handled by UsersService (which includes hashing)
    return this.usersService.createUser(body.username, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) throw new BadRequestException('Invalid credentials');
    return this.authService.login(user);
  }

  // POST /auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: RefreshTokenDto) {
    if (!body.refreshToken) {
        throw new BadRequestException('Refresh token is required for logout.');
    }
    // CRITICAL FIX: Use the token-based logout method
    return this.authService.logoutByToken(body.refreshToken); 
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshTokens(body.refreshToken);
  }
}
