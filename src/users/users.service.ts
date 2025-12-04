import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs'; // Assuming bcrypt is needed for password hashing

// Define a common interface for User data retrieved from DB
interface UserDb {
    user_id: number;
    username: string;
    password_hash: string;
    refresh_token: string | null;
    role: 'user' | 'admin';
    // Add other fields from your users table here
}

@Injectable()
export class UsersService {
    // NOTE: Relying on previous working context where DatabaseService exposes a connection method.
    constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

    // --- Authentication Required Methods (Restored) ---

    async findById(userId: number): Promise<UserDb | null> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        const [rows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
        return (rows as UserDb[])[0] || null;
    }

    async findByUsername(username: string): Promise<UserDb | null> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        return (rows as UserDb[])[0] || null;
    }

    async findByRefreshToken(refreshToken: string): Promise<UserDb | null> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        const [rows] = await connection.execute('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);
        return (rows as UserDb[])[0] || null;
    }

    async createUser(username: string, password: string): Promise<any> {
        const passwordHash = await bcrypt.hash(password, 10);
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        // Role defaults to 'user' as defined in scheme.sql
        const [result] = await connection.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, passwordHash]
        );
        const insertedId = (result as mysql.ResultSetHeader).insertId;
        return { user_id: insertedId, username, role: 'user' };
    }

    async setRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        await connection.execute(
            'UPDATE users SET refresh_token = ? WHERE user_id = ?',
            [refreshToken, userId]
        );
    }

    // --- Dashboard/CRUD Methods (Updated) ---

    // READ ALL USERS
    async findAll(): Promise<any[]> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        const [rows] = await connection.execute('SELECT user_id, username, role, created_at FROM users');
        return rows as any[];
    }

    // UPDATE USER ROLE (Used by PUT /users/:id)
    async updateRole(userId: number, role: 'user' | 'admin'): Promise<any> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        
        const [result] = await connection.execute(
            'UPDATE users SET role = ? WHERE user_id = ?',
            [role, userId]
        );

        if ((result as mysql.ResultSetHeader).affectedRows === 0) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        return { user_id: userId, role };
    }

    // DELETE USER (Used by DELETE /users/:id)
    async deleteUser(userId: number): Promise<void> {
        const connection = await this.databaseService.getConnection(); // Assuming this method exists
        const [result] = await connection.execute(
            'DELETE FROM users WHERE user_id = ?',
            [userId]
        );

        if ((result as mysql.ResultSetHeader).affectedRows === 0) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }
}
