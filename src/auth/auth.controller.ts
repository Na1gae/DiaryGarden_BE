import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('verify')
    async verifyToken(@Headers('authorization') authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('토큰이 제공되지 않았습니다.');
        }

        const token = authHeader.substring(7);
        return this.authService.verifyToken(token);
    }

    @Get('user')
    @UseGuards(JwtAuthGuard)
    async getCurrentUser(@CurrentUser() user: { userId: string }) {
        return this.authService.getCurrentUser(user.userId);
    }

    @Post('refresh')
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
    }
}
