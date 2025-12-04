import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiHeader,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    RefreshTokenDto,
    AuthSessionDto,
    UserResponseDto,
    TokenVerifyResponseDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('인증 (Auth)')
@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({
        summary: '회원가입',
        description: '새로운 사용자 계정을 생성합니다. 사용자 아이디는 최소 3자, 비밀번호는 최소 6자 이상이어야 합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '회원가입 성공',
        type: AuthSessionDto,
    })
    @ApiBadRequestResponse({
        description: '잘못된 요청 (유효성 검사 실패)',
    })
    @ApiConflictResponse({
        description: '이미 존재하는 사용자 아이디',
    })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({
        summary: '로그인',
        description: '사용자 아이디와 비밀번호로 로그인합니다. 성공 시 JWT 토큰과 리프레시 토큰을 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '로그인 성공',
        type: AuthSessionDto,
    })
    @ApiUnauthorizedResponse({
        description: '인증 실패 (아이디 또는 비밀번호 불일치)',
    })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('verify')
    @ApiOperation({
        summary: '토큰 검증',
        description: 'JWT 액세스 토큰의 유효성을 검증합니다.',
    })
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer 토큰 (예: Bearer eyJhbGci...)',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: '토큰 유효',
        type: TokenVerifyResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: '토큰이 없거나 유효하지 않음',
    })
    async verifyToken(@Headers('authorization') authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('토큰이 제공되지 않았습니다.');
        }

        const token = authHeader.substring(7);
        return this.authService.verifyToken(token);
    }

    @Get('user')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '현재 사용자 정보 조회',
        description: '로그인한 사용자의 프로필 정보를 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '사용자 정보 조회 성공',
        type: UserResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: '인증 필요 (토큰 없음 또는 만료)',
    })
    async getCurrentUser(@CurrentUser() user: { userId: string }) {
        return this.authService.getCurrentUser(user.userId);
    }

    @Post('refresh')
    @ApiOperation({
        summary: '토큰 갱신',
        description: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.',
    })
    @ApiResponse({
        status: 200,
        description: '토큰 갱신 성공',
        type: AuthSessionDto,
    })
    @ApiUnauthorizedResponse({
        description: '유효하지 않은 리프레시 토큰',
    })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
    }
}
