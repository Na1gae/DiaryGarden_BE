import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTreePositionDto {
  @ApiProperty({
    description: '나무의 X축 위치 (0.0 ~ 1.0 사이의 정규화된 값)',
    example: 0.5,
    minimum: 0.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  positionX: number;

  @ApiProperty({
    description: '나무의 Y축 위치 (0.0 ~ 1.0 사이의 정규화된 값)',
    example: 0.3,
    minimum: 0.0,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  positionY: number;
}
