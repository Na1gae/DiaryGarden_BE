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

    async createDiary(
        userId: string,
        createDiaryDto: CreateDiaryDto,
    ): Promise<DiaryResponseDto> {
        const { treeId, content } = createDiaryDto;

        // Verify tree belongs to user
        const tree = await this.prisma.tree.findFirst({
            where: {
                id: treeId,
                userId,
            },
        });

        if (!tree) {
            throw new BadRequestException('해당 트리를 찾을 수 없거나 접근 권한이 없습니다.');
        }

        // Create diary first
        const diary = await this.prisma.diary.create({
            data: {
                userId,
                treeId,
                content,
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
            content: diary.content,
            writtenDate: diary.writtenDate,
            createdAt: diary.createdAt,
            updatedAt: diary.updatedAt,
            emotionScores: diary.emotionScores as Record<string, number>,
            dominantEmotion: diary.dominantEmotion,
        };
    }
}
