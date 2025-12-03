import { IsNumber, Min, Max } from 'class-validator';

export class UpdateTreePositionDto {
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  positionX: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  positionY: number;
}
