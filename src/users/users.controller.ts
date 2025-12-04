import { Controller, Get, Post, Body, UseGuards, Put, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming you have this guard

// DTOs (Data Transfer Objects) for request validation
class UpdateUserDto {
    role?: 'user' | 'admin';
    // Add other fields you might want to allow updating later, like status
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // 1. READ ALL USERS (Protected Endpoint)
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        // This relies on usersService.findAll() to correctly fetch all users
        return this.usersService.findAll();
    }

    // 2. UPDATE USER (Protected Endpoint)
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
        // Here we rely on the service to update the user record by ID
        const result = await this.usersService.updateRole(+userId, updateUserDto.role);
        return { message: 'User updated successfully', user: result };
    }
    
    // 3. DELETE USER (Protected Endpoint)
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Correct status code for successful deletion
    async delete(@Param('id') userId: string) {
        await this.usersService.deleteUser(+userId);
        // Returns a 204 No Content response
    }

    // NOTE: Creation (POST) is still handled by the separate AuthController /auth/register endpoint.
}
