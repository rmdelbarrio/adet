import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as mysql from 'mysql2/promise';

@Injectable()
export class UsersService {
    constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

    // ... (Other existing methods like findByUsername, createUser, setRefreshToken) ...
    
    // NEW: Fetch all users
    async findAll(): Promise<any[]> {
        const connection = await this.databaseService.getConnection();
        const [rows] = await connection.execute('SELECT user_id, username, role, created_at FROM users');
        return rows as any[];
    }

    // NEW: Update user role
    async updateRole(userId: number, role: 'user' | 'admin'): Promise<any> {
        const connection = await this.databaseService.getConnection();
        // NOTE: If you add status later, you would include it here
        const [result] = await connection.execute(
            'UPDATE users SET role = ? WHERE user_id = ?',
            [role, userId]
        );

        if ((result as mysql.ResultSetHeader).affectedRows === 0) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        return { user_id: userId, role };
    }

    // NEW: Delete user
    async deleteUser(userId: number): Promise<void> {
        const connection = await this.databaseService.getConnection();
        const [result] = await connection.execute(
            'DELETE FROM users WHERE user_id = ?',
            [userId]
        );

        if ((result as mysql.ResultSetHeader).affectedRows === 0) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }
}
