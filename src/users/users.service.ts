import { Injectable, Inject, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs'; 
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Define a common interface for User data retrieved from DB
interface UserDb extends RowDataPacket {
    // FIX: Using 'id' to match the scheme.sql PRIMARY KEY
    id: number; 
    username: string;
    // FIX: Using 'password' to match the scheme.sql password column
    password: string; 
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
            // FIX: WHERE id = ?
            const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
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
        // FIX: Hashing the input password before storing
        const passwordHash = await bcrypt.hash(password, 10); 
        const connection = await this.databaseService.getConnection(); 
        try {
            // FIX: Use 'password' column name in INSERT statement
            const [result] = await connection.execute<ResultSetHeader>(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                [username, passwordHash]
            );
            const insertedId = result.insertId;
            // FIX: Return 'id'
            return { id: insertedId, username, role: 'user' };
        } finally {
            connection.release();
        }
    }

    async setRefreshToken(userId: number, refreshToken: string | null): Promise<void> {
        const connection = await this.databaseService.getConnection(); 
        try {
            // FIX: Use 'id' for WHERE clause
            await connection.execute(
                'UPDATE users SET refresh_token = ? WHERE id = ?',
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
            // FIX: Select 'id'
            const [rows] = await connection.execute('SELECT id, username, role, created_at FROM users');
            return rows as any[];
        } finally {
            connection.release();
        }
    }

    async updateRole(userId: number, role: 'user' | 'admin'): Promise<any> {
        const connection = await this.databaseService.getConnection(); 
        try {
            // FIX: Use 'id' for WHERE clause
            const [result] = await connection.execute<ResultSetHeader>(
                'UPDATE users SET role = ? WHERE id = ?',
                [role, userId]
            );

            if (result.affectedRows === 0) {
                throw new NotFoundException('User not found');
            }
            return { id: userId, role };
        } finally {
            connection.release();
        }
    }

    async deleteUser(userId: number): Promise<void> {
        const connection = await this.databaseService.getConnection(); 
        try {
            // FIX: Use 'id' for WHERE clause
            const [result] = await connection.execute<ResultSetHeader>(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            if (result.affectedRows === 0) {
                throw new NotFoundException('User not found');
            }
        } finally {
            connection.release();
        }
    }
}
