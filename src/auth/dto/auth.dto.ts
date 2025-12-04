import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: '사용자 아이디 (최소 3자)',
        example: 'johndoe',
        minLength: 3,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @ApiProperty({
        description: '비밀번호 (최소 6자)',
        example: 'password123',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({
        description: '화면에 표시될 이름',
        example: '홍길동',
    })
    @IsString()
    @IsNotEmpty()
    displayName: string;
}

export class LoginDto {
    @ApiProperty({
        description: '사용자 아이디',
        example: 'johndoe',
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: '비밀번호',
        example: 'password123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: '리프레시 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class AuthSessionDto {
    @ApiProperty({
        description: 'JWT 액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    token: string;

    @ApiProperty({
        description: '사용자 고유 ID',
        example: 'user_abc123',
    })
    uid: string;

    @ApiProperty({
        description: '화면에 표시될 이름',
        example: '홍길동',
    })
    displayName: string;

    @ApiProperty({
        description: '사용자 아이디',
        example: 'johndoe',
    })
    username: string;

    @ApiPropertyOptional({
        description: '리프레시 토큰 (로그인 시에만 제공)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken?: string;
}

export class UserResponseDto {
    @ApiProperty({
        description: '사용자 고유 ID',
        example: 'user_abc123',
    })
    id: string;

    @ApiProperty({
        description: '사용자 아이디',
        example: 'johndoe',
    })
    username: string;

    @ApiProperty({
        description: '화면에 표시될 이름',
        example: '홍길동',
    })
    displayName: string;

    @ApiProperty({
        description: '계정 생성일',
        example: '2024-01-15T09:00:00.000Z',
    })
    createdAt: Date;
}

export class TokenVerifyResponseDto {
    @ApiProperty({
        description: '토큰 유효 여부',
        example: true,
    })
    valid: boolean;

    @ApiProperty({
        description: '사용자 고유 ID',
        example: 'user_abc123',
    })
    userId: string;
}
