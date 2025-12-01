import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateDiaryDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsDateString()
    writtenDate?: string; // ISO 날짜 문자열, 없으면 오늘 날짜 사용
}
