// Changed all the fields to position instead of users
// modified endpoints to make it for position
// modified handling for position
// modified validation for fields for position
// Added user_id in position creation

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PositionService } from './position.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('positions')
export class PositionController {
  constructor(private positionService: PositionService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.positionService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-positions')
  async getMyPositions(@Request() req: any) {
    return this.positionService.getPositionsByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.positionService.findById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('code/:code')
  async getByCode(@Param('code') code: string) {
    return this.positionService.findByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    if (!body.position_code || !body.position_name) {
      return { message: 'Invalid input: position_code and position_name are required' };
    }
    
    const positionData = {
      ...body,
      user_id: req.user.userId
    };
    
    return this.positionService.createPosition(positionData);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.positionService.updatePosition(+id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.positionService.deletePosition(+id);
  }
}