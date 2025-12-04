import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiaryDto {
    @ApiProperty({
        description: '일기 제목 (최대 15자)',
        example: '오늘의 일기',
        maxLength: 15,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(15)
    title: string;

    @ApiProperty({
        description: '일기 본문 내용',
        example: '오늘은 정말 좋은 하루였다. 맑은 날씨에 산책도 하고...',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiPropertyOptional({
        description: '일기 작성 날짜 (ISO 8601 형식). 지정하지 않으면 오늘 날짜가 사용됩니다.',
        example: '2024-12-04',
    })
    @IsOptional()
    @IsDateString()
    writtenDate?: string;
}
