import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { DiaryResponseDto } from './dto/diary-response.dto';

@Injectable()
export class DiaryService {
    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
    ) { }

    /**
     * 주어진 날짜가 속한 주의 시작일(월요일)과 종료일(일요일)을 반환
     */
    private getWeekRange(date: Date): { weekStart: Date; weekEnd: Date } {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
        
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        return { weekStart, weekEnd };
    }

    /**
     * 주간 트리 이름 생성 (예: "2025년 12월 1주차")
     */
    private getWeeklyTreeName(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        return `${year}년 ${month}월 ${weekOfMonth}주차`;
    }

    /**
     * 해당 주의 트리를 찾거나 새로 생성
     */
    private async getOrCreateWeeklyTree(userId: string, date: Date): Promise<string> {
        const { weekStart, weekEnd } = this.getWeekRange(date);
        
        // 해당 주에 생성된 트리 찾기
        const existingTree = await this.prisma.tree.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
        });

        if (existingTree) {
            return existingTree.id;
        }

        // 없으면 새 트리 생성
        const treeName = this.getWeeklyTreeName(date);
        const newTree = await this.prisma.tree.create({
            data: {
                userId,
                name: treeName,
            },
        });

        return newTree.id;
    }

    async createDiary(
        userId: string,
        createDiaryDto: CreateDiaryDto,
    ): Promise<DiaryResponseDto> {
        const { title, content, writtenDate } = createDiaryDto;
        
        // 날짜 처리: 제공된 날짜 또는 오늘
        const diaryDate = writtenDate ? new Date(writtenDate) : new Date();
        
        // 해당 주의 트리 가져오기 (없으면 자동 생성)
        const treeId = await this.getOrCreateWeeklyTree(userId, diaryDate);

        // Create diary first
        const diary = await this.prisma.diary.create({
            data: {
                userId,
                treeId,
                title,
                content,
                writtenDate: diaryDate,
            },
        });

        // Analyze emotion asynchronously and update diary
        try {
            const emotionResult = await this.aiService.analyzeEmotion(content);

            const updatedDiary = await this.prisma.diary.update({
                where: { id: diary.id },
                data: {
                    emotionScores: emotionResult.emotionScores,
                    dominantEmotion: emotionResult.dominantEmotion,
                },
            });

            return this.toDiaryResponse(updatedDiary);
        } catch (error) {
            // Return diary even if AI analysis fails
            return this.toDiaryResponse(diary);
        }
    }

    async getDiary(diaryId: string, userId?: string): Promise<DiaryResponseDto> {
        const diary = await this.prisma.diary.findUnique({
            where: { id: diaryId },
        });

        if (!diary) {
            throw new NotFoundException('일기를 찾을 수 없습니다.');
        }

        // If userId is provided, check authorization
        if (userId && diary.userId !== userId) {
            throw new ForbiddenException('이 일기에 접근할 권한이 없습니다.');
        }

        return this.toDiaryResponse(diary);
    }

    async getDiaries(
        userId: string,
        limit: number = 0,
        lastDocId?: string,
        updatedAfter?: string,
    ): Promise<DiaryResponseDto[]> {
        const whereClause: any = { userId };

        // Add updatedAfter filter for incremental sync
        if (updatedAfter) {
            whereClause.updatedAt = {
                gte: new Date(updatedAfter),
            };
        }

        const queryOptions: any = {
            where: whereClause,
            orderBy: { writtenDate: 'desc' },
        };

        // Cursor-based pagination
        if (lastDocId) {
            queryOptions.cursor = { id: lastDocId };
            queryOptions.skip = 1; // Skip the cursor itself
        }

        if (limit > 0) {
            queryOptions.take = limit;
        }

        const diaries = await this.prisma.diary.findMany(queryOptions);

        return diaries.map((diary) => this.toDiaryResponse(diary));
    }

    private toDiaryResponse(diary: any): DiaryResponseDto {
        return {
            id: diary.id,
            userId: diary.userId,
            treeId: diary.treeId,
            title: diary.title,
            content: diary.content,
            writtenDate: diary.writtenDate,
            createdAt: diary.createdAt,
            updatedAt: diary.updatedAt,
            emotionScores: diary.emotionScores as Record<string, number>,
            dominantEmotion: diary.dominantEmotion,
        };
    }
}
