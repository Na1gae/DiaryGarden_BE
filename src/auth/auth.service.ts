import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthSessionDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto): Promise<AuthSessionDto> {
        const { username, password, displayName } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            throw new ConflictException('사용자명이 이미 존재합니다.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and default tree in a transaction
        const user = await this.prisma.$transaction(async (prisma) => {
            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    displayName,
                    nickname: displayName,
                },
            });

            // Create default tree for the user
            await prisma.tree.create({
                data: {
                    userId: newUser.id,
                    name: 'My Diary Tree',
                },
            });

            return newUser;
        });

        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.username);
        const refreshToken = await this.generateRefreshToken(user.id);

        return this.buildAuthSession(user, accessToken, refreshToken);
    }

    async login(loginDto: LoginDto): Promise<AuthSessionDto> {
        const { username, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new UnauthorizedException('잘못된 사용자명 또는 비밀번호입니다.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('잘못된 사용자명 또는 비밀번호입니다.');
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.username);
        const refreshToken = await this.generateRefreshToken(user.id);

        return this.buildAuthSession(user, accessToken, refreshToken);
    }

    async verifyToken(token: string): Promise<AuthSessionDto> {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
            }

            return this.buildAuthSession(user, token);
        } catch (error) {
            throw new UnauthorizedException('토큰이 유효하지 않습니다.');
        }
    }

    async getCurrentUser(userId: string): Promise<AuthSessionDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
        }

        const accessToken = this.generateAccessToken(user.id, user.username);
        return this.buildAuthSession(user, accessToken);
    }

    async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedException('리프레시 토큰이 유효하지 않거나 만료되었습니다.');
        }

        const accessToken = this.generateAccessToken(
            storedToken.user.id,
            storedToken.user.username,
        );

        return { token: accessToken };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
        }

        return user;
    }

    private generateAccessToken(userId: string, username: string): string {
        const payload = { sub: userId, username };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '15m',
        });
    }

    private async generateRefreshToken(userId: string): Promise<string> {
        const token = this.jwtService.sign(
            { sub: userId, type: 'refresh' },
            {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
            },
        );

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Limit the number of refresh tokens per user (e.g., max 5)
        const MAX_REFRESH_TOKENS = 5;
        const tokenCount = await this.prisma.refreshToken.count({
            where: { userId },
        });

        if (tokenCount >= MAX_REFRESH_TOKENS) {
            const tokensToDelete = await this.prisma.refreshToken.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                take: tokenCount - MAX_REFRESH_TOKENS + 1, // Delete oldest + space for new one
                select: { id: true },
            });

            if (tokensToDelete.length > 0) {
                await this.prisma.refreshToken.deleteMany({
                    where: {
                        id: { in: tokensToDelete.map((t) => t.id) },
                    },
                });
            }
        }

        // Store refresh token in database
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });

        return token;
    }

    private buildAuthSession(
        user: any,
        accessToken: string,
        refreshToken?: string,
    ): AuthSessionDto {
        return {
            token: accessToken,
            uid: user.uid,
            displayName: user.displayName,
            username: user.username,
            ...(refreshToken && { refreshToken }),
        };
    }
}
