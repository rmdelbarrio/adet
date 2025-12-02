import { Controller, Get, UseGuards, SetMetadata, Request, Body, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from '../users/users.service';

// Custom decorator for role metadata (to be placed in auth/roles.decorator.ts)
// Since we don't have that file, we'll use SetMetadata directly here for simplicity
const AdminRole = () => SetMetadata('roles', ['admin']);

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard) // 1. Check if logged in 2. Check if role is admin
  @AdminRole()
  @Get('stats')
  async getDashboardStats(@Request() req) {
    // This endpoint is only reached if the user is logged in AND has the 'admin' role
    const allUsers = await this.usersService.findAll();
    
    return {
      message: `Welcome, ${req.user.username}. This is the Admin Dashboard.`,
      userCount: allUsers.length,
      adminOnlyData: 'This data is protected by the RolesGuard.',
      recentUsers: allUsers.slice(0, 5),
    };
  }
}
