import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs'; 

// Define a common interface for User data retrieved from DB
interface UserDb {
    user_id: number;
    username: string;
    password_hash: string; // CRITICAL: Used for authentication
    refresh_token: string | null;
    role: 'user' | 'admin';
}

@Injectable()
export class UsersService {
    constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

    // --- Authentication Required Methods ---

    async findById(userId: number): Promise<UserDb | null> {
        const connection = await this.databaseService.getConnection(); 
        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
            return (rows as UserDb[])[0] || null;
        } finally {
            connection.release();
        }
    }

    async findByUsername(username: string): Promise<UserDb | null> {
        const connection = await this.databaseService.getConnection(); 
        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
            return (rows as UserDb[])[0] || null;
        } finally {
            connection.release();
        }
    }

    async findByRefreshToken(refreshToken: string): Promise<UserDb | null> {
        const connection = await this.databaseService.getConnection(); 
        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);
            return (rows as UserDb[])[0] || null;
        } finally {
            connection.release();
        }
    }

    async createUser(username: string, password: string): Promise<any> {
        const passwordHash = await bcrypt.hash(password, 10);
        const connection = await this.databaseService.getConnection(); 
        try {
            const [result] = await connection.execute(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                [username, passwordHash]
            );
            const insertedId = (result as mysql.ResultSetHeader).insertId;
            return { user_id: insertedId, username, role: 'user' };
        } finally {
            connection.release();
        }
    }

    async setRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        const connection = await this.databaseService.getConnection(); 
        try {
            await connection.execute(
                'UPDATE users SET refresh_token = ? WHERE user_id = ?',
                [refreshToken, userId]
            );
        } finally {
            connection.release();
        }
    }

    // --- Dashboard/CRUD Methods ---

    async findAll(): Promise<any[]> {
        const connection = await this.databaseService.getConnection(); 
        try {
            // Only select necessary public fields
            const [rows] = await connection.execute('SELECT user_id, username, role, created_at FROM users');
            return rows as any[];
        } finally {
            connection.release();
        }
    }

    async updateRole(userId: number, role: 'user' | 'admin'): Promise<any> {
        const connection = await this.databaseService.getConnection(); 
        try {
            const [result] = await connection.execute(
                'UPDATE users SET role = ? WHERE user_id = ?',
                [role, userId]
            );

            if ((result as mysql.ResultSetHeader).affectedRows === 0) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
            return { user_id: userId, role };
        } finally {
            connection.release();
        }
    }

    async deleteUser(userId: number): Promise<void> {
        const connection = await this.databaseService.getConnection(); 
        try {
            const [result] = await connection.execute(
                'DELETE FROM users WHERE user_id = ?',
                [userId]
            );

            if ((result as mysql.ResultSetHeader).affectedRows === 0) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
        } finally {
            connection.release();
        }
    }
}
