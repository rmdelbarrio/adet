import { Controller, Get, Post, Body, UseGuards, Put, Param, Delete, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Use the existing guard

// DTOs (Data Transfer Objects) for request validation
// This DTO defines the data structure expected for a PUT request to update a user.
class UpdateUserDto {
    // Role is expected to be one of these literal strings.
    role?: 'user' | 'admin'; 
    // We will ignore status for the backend since it's not in the DB schema, 
    // but a production DTO would include all updatable fields.
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // --- READ ALL USERS ---
    // GET /users
    // Fetches a list of all registered users (visible in the dashboard table).
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    // --- UPDATE USER ---
    // PUT /users/:id
    // Allows updating user properties like role.
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
        const { role } = updateUserDto;
        
        // Input validation: ensure a role is provided, even if it's the current one.
        if (!role) {
            throw new BadRequestException('Role field is required for user update.');
        }

        // Call the service to update the role in the database.
        const result = await this.usersService.updateRole(+userId, role);
        return { message: 'User updated successfully', user: result };
    }
    
    // --- DELETE USER ---
    // DELETE /users/:id
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Returns 204 on successful deletion
    async delete(@Param('id') userId: string) {
        // Call the service to delete the user record.
        await this.usersService.deleteUser(+userId);
    }

    // NOTE: User creation (Registration) is handled by POST /auth/register in AuthController.
}
