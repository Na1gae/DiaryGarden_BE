import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { GardenService } from './garden.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateTreePositionDto } from './dto/update-tree-position.dto';

@Controller('api/gardens')
@UseGuards(JwtAuthGuard)
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Get(':gardenLevel/trees/positions')
  async getTreePositions(
    @Param('gardenLevel') gardenLevel: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gardenService.getTreePositions(user.userId, gardenLevel);
  }

  @Put(':gardenLevel/trees/positions/:treeId')
  async updateTreePosition(
    @Param('gardenLevel') gardenLevel: string,
    @Param('treeId') treeId: string,
    @Body() updateDto: UpdateTreePositionDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gardenService.updateTreePosition(
      user.userId,
      gardenLevel,
      treeId,
      updateDto,
    );
  }
}
