import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDetailDto {
    @ApiProperty({
        description: '에러 메시지',
        example: '요청이 잘못되었습니다.',
    })
    message: string;

    @ApiProperty({
        description: 'HTTP 상태 코드',
        example: 400,
    })
    statusCode: number;

    @ApiPropertyOptional({
        description: '상세 에러 정보 (유효성 검사 실패 시)',
        example: ['username은 최소 3자 이상이어야 합니다'],
        type: [String],
    })
    details?: string[];
}

export class ApiResponseDto<T> {
    @ApiProperty({
        description: '요청 성공 여부',
        example: true,
    })
    success: boolean;

    @ApiPropertyOptional({
        description: '응답 데이터 (성공 시)',
    })
    data?: T;

    @ApiPropertyOptional({
        description: '에러 정보 (실패 시)',
        type: ErrorDetailDto,
    })
    error?: ErrorDetailDto;

    @ApiProperty({
        description: '응답 시간',
        example: '2024-12-04T09:30:00.000Z',
    })
    timestamp: string;
}

export class UnauthorizedResponseDto {
    @ApiProperty({ example: false })
    success: boolean;

    @ApiProperty({
        type: ErrorDetailDto,
        example: {
            message: '인증이 필요합니다.',
            statusCode: 401,
        },
    })
    error: ErrorDetailDto;

    @ApiProperty({ example: '2024-12-04T09:30:00.000Z' })
    timestamp: string;
}

export class BadRequestResponseDto {
    @ApiProperty({ example: false })
    success: boolean;

    @ApiProperty({
        type: ErrorDetailDto,
        example: {
            message: '요청이 잘못되었습니다.',
            statusCode: 400,
            details: ['title은 최대 15자까지 입력 가능합니다'],
        },
    })
    error: ErrorDetailDto;

    @ApiProperty({ example: '2024-12-04T09:30:00.000Z' })
    timestamp: string;
}

export class NotFoundResponseDto {
    @ApiProperty({ example: false })
    success: boolean;

    @ApiProperty({
        type: ErrorDetailDto,
        example: {
            message: '리소스를 찾을 수 없습니다.',
            statusCode: 404,
        },
    })
    error: ErrorDetailDto;

    @ApiProperty({ example: '2024-12-04T09:30:00.000Z' })
    timestamp: string;
}

export class ConflictResponseDto {
    @ApiProperty({ example: false })
    success: boolean;

    @ApiProperty({
        type: ErrorDetailDto,
        example: {
            message: '이미 존재하는 리소스입니다.',
            statusCode: 409,
        },
    })
    error: ErrorDetailDto;

    @ApiProperty({ example: '2024-12-04T09:30:00.000Z' })
    timestamp: string;
}
