// Changed all the fields to position instead of users
// added DTO interfaces for the position
// added more queries
// added user position retrieval and error handing
// modified validation for position

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2';

interface CreatePositionDto {
  position_code: string;
  position_name: string;
  min_salary?: number;
  department?: string;
  user_id: number; 
}

interface UpdatePositionDto {
  position_code?: string;
  position_name?: string;
  min_salary?: number;
  department?: string;
}

@Injectable()
export class PositionService {
  constructor(private db: DatabaseService) { }

  private pool = () => this.db.getPool();

  async createPosition(positionData: CreatePositionDto) {
    try {
      const [result] = await this.pool().execute<ResultSetHeader>(
        `INSERT INTO positions 
         (position_code, position_name, min_salary, department, user_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          positionData.position_code,
          positionData.position_name,
          positionData.min_salary || null,
          positionData.department || null,
          positionData.user_id
        ],
      );
      
      return this.findById(result.insertId);
    } catch (error: any) {
      console.error('Error creating position:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Position code already exists');
      }
      throw new InternalServerErrorException('Database error');
    }
  }

  async findById(position_id: number) {
    try {
      const [rows] = await this.pool().execute<RowDataPacket[]>(
        `SELECT p.*, u.username as created_by 
         FROM positions p 
         LEFT JOIN users u ON p.user_id = u.id 
         WHERE p.position_id = ?`,
        [position_id],
      );
      
      if (!rows[0]) {
        throw new NotFoundException(`Position with ID ${position_id} not found`);
      }
      
      return rows[0];
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error finding position by ID:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  async findByCode(position_code: string) {
    try {
      const [rows] = await this.pool().execute<RowDataPacket[]>(
        `SELECT p.*, u.username as created_by 
         FROM positions p 
         LEFT JOIN users u ON p.user_id = u.id 
         WHERE p.position_code = ?`,
        [position_code],
      );
      return rows[0];
    } catch (error: any) {
      console.error('Error finding position by code:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  async getAll() {
    try {
      const [rows] = await this.pool().execute<RowDataPacket[]>(
        `SELECT p.*, u.username as created_by 
         FROM positions p 
         LEFT JOIN users u ON p.user_id = u.id 
         ORDER BY p.created_at DESC`
      );
      return rows;
    } catch (error: any) {
      console.error('Error getting all positions:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  async getPositionsByUser(user_id: number) {
    try {
      const [rows] = await this.pool().execute<RowDataPacket[]>(
        `SELECT p.*, u.username as created_by 
         FROM positions p 
         LEFT JOIN users u ON p.user_id = u.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC`,
        [user_id],
      );
      return rows;
    } catch (error: any) {
      console.error('Error getting positions by user:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  async updatePosition(position_id: number, updateData: UpdatePositionDto) {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updateData.position_code) {
        fields.push('position_code = ?');
        values.push(updateData.position_code);
      }

      if (updateData.position_name) {
        fields.push('position_name = ?');
        values.push(updateData.position_name);
      }

      if (updateData.min_salary !== undefined) {
        fields.push('min_salary = ?');
        values.push(updateData.min_salary);
      }

      if (updateData.department !== undefined) {
        fields.push('department = ?');
        values.push(updateData.department);
      }

      if (fields.length === 0) {
        return await this.findById(position_id);
      }

      values.push(position_id);

      await this.pool().execute(
        `UPDATE positions SET ${fields.join(', ')} WHERE position_id = ?`,
        values,
      );

      return this.findById(position_id);
    } catch (error: any) {
      console.error('Error updating position:', error);
      throw new InternalServerErrorException('Database error');
    }
  }

  async deletePosition(position_id: number) {
    try {
      const [res] = await this.pool().execute<OkPacket>(
        'DELETE FROM positions WHERE position_id = ?',
        [position_id],
      );
      return res.affectedRows > 0;
    } catch (error: any) {
      console.error('Error deleting position:', error);
      throw new InternalServerErrorException('Database error');
    }
  }
}