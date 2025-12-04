import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { GardenService } from './garden.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateTreePositionDto } from './dto/update-tree-position.dto';
import { TreePositionResponseDto } from './dto/tree-position-response.dto';

@ApiTags('정원 (Garden)')
@Controller('api/gardens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Get(':gardenLevel/trees/positions')
  @ApiOperation({
    summary: '정원 나무 위치 조회',
    description: '특정 정원 레벨(연도 또는 연월)에 있는 모든 나무의 위치를 조회합니다. 각 나무는 정규화된 좌표(0.0~1.0)로 표현됩니다.',
  })
  @ApiParam({
    name: 'gardenLevel',
    description: '정원 레벨 (연도: "2024" 또는 연월: "2024-12")',
    example: '2024-12',
  })
  @ApiResponse({
    status: 200,
    description: '나무 위치 목록 조회 성공',
    type: [TreePositionResponseDto],
  })
  @ApiBadRequestResponse({
    description: '잘못된 gardenLevel 형식',
  })
  @ApiUnauthorizedResponse({
    description: '인증 필요 (토큰 없음 또는 만료)',
  })
  async getTreePositions(
    @Param('gardenLevel') gardenLevel: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gardenService.getTreePositions(user.userId, gardenLevel);
  }

  @Put(':gardenLevel/trees/positions/:treeId')
  @ApiOperation({
    summary: '나무 위치 수정',
    description: '특정 정원에서 나무의 위치를 수정합니다. 좌표는 0.0~1.0 사이의 정규화된 값이어야 합니다.',
  })
  @ApiParam({
    name: 'gardenLevel',
    description: '정원 레벨 (연도: "2024" 또는 연월: "2024-12")',
    example: '2024-12',
  })
  @ApiParam({
    name: 'treeId',
    description: '위치를 수정할 나무의 고유 ID',
    example: 'tree_abc123',
  })
  @ApiResponse({
    status: 200,
    description: '나무 위치 수정 성공',
    type: TreePositionResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청 (좌표 범위 초과 또는 잘못된 gardenLevel 형식)',
  })
  @ApiNotFoundResponse({
    description: '나무를 찾을 수 없음',
  })
  @ApiUnauthorizedResponse({
    description: '인증 필요 (토큰 없음 또는 만료)',
  })
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
