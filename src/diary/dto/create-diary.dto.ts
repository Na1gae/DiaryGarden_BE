import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateDiaryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(15)
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsDateString()
    writtenDate?: string; // ISO 날짜 문자열, 없으면 오늘 날짜 사용
}
