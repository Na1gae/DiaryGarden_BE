import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { GardenService } from './garden.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UpdateTreePositionDto } from './dto/update-tree-position.dto';

@Controller('api/gardens')
@UseGuards(JwtAuthGuard)
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Get(':gardenLevel/trees/positions')
  async getTreePositions(
    @Param('gardenLevel') gardenLevel: string,
    @CurrentUser() user: User,
  ) {
    const positions = await this.gardenService.getTreePositions(user.id, gardenLevel);
    return {
      success: true,
      data: positions,
    };
  }

  @Put(':gardenLevel/trees/positions/:treeId')
  async updateTreePosition(
    @Param('gardenLevel') gardenLevel: string,
    @Param('treeId') treeId: string,
    @Body() updateDto: UpdateTreePositionDto,
    @CurrentUser() user: User,
  ) {
    const position = await this.gardenService.updateTreePosition(
      user.id,
      gardenLevel,
      treeId,
      updateDto,
    );
    return {
      success: true,
      data: position,
    };
  }
}
