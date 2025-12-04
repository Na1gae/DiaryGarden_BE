import { ApiProperty } from '@nestjs/swagger';

export class TreePositionResponseDto {
  @ApiProperty({
    description: '정원 레벨 (연도 또는 연월 형식)',
    example: '2024-12',
  })
  gardenLevel: string;

  @ApiProperty({
    description: '나무 고유 ID',
    example: 'tree_abc123',
  })
  treeId: string;

  @ApiProperty({
    description: '나무의 X축 위치 (0.0 ~ 1.0)',
    example: 0.5,
  })
  positionX: number;

  @ApiProperty({
    description: '나무의 Y축 위치 (0.0 ~ 1.0)',
    example: 0.3,
  })
  positionY: number;

  @ApiProperty({
    description: '위치 최종 수정 시간',
    example: '2024-12-04T09:30:00.000Z',
  })
  updatedAt: string;
}
