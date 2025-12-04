import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// DTOs for type safety and clarity
class LoginDto {
  username: string;
  password: string;
}

class RegisterDto {
  username: string;
  password: string;
}

class RefreshTokenDto {
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    if (!body || !body.username || !body.password) {
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Username and password are required' };
    }
    // Creation is handled by UsersService (which includes hashing)
    return this.usersService.createUser(body.username, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) return { error: 'Invalid credentials' };
    return this.authService.login(user);
  }

  // FIX: This section is the source of the build error. 
  // We need to keep only the logout method that the frontend actually calls: POST /auth/logout, 
  // which uses the token.
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
