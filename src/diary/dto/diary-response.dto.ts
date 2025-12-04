import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmotionScoresDto {
    @ApiPropertyOptional({ description: '기쁨 점수', example: 0.25 })
    happy?: number;

    @ApiPropertyOptional({ description: '슬픔 점수', example: 0.25 })
    sad?: number;

    @ApiPropertyOptional({ description: '화남 점수', example: 0.25 })
    angry?: number;

    @ApiPropertyOptional({ description: '차분 점수', example: 0.25 })
    calm?: number;
}

export class DiaryResponseDto {
    @ApiProperty({
        description: '일기 고유 ID',
        example: 'diary_abc123',
    })
    id: string;

    @ApiProperty({
        description: '작성자 사용자 ID',
        example: 'user_abc123',
    })
    userId: string;

    @ApiProperty({
        description: '연결된 나무 ID',
        example: 'tree_abc123',
    })
    treeId: string;

    @ApiProperty({
        description: '일기 제목',
        example: '오늘의 일기',
    })
    title: string;

    @ApiProperty({
        description: '일기 본문 내용',
        example: '오늘은 정말 좋은 하루였다...',
    })
    content: string;

    @ApiProperty({
        description: '일기 작성 날짜',
        example: '2024-12-04T00:00:00.000Z',
    })
    writtenDate: Date;

    @ApiProperty({
        description: '일기 생성 시간',
        example: '2024-12-04T09:30:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: '일기 최종 수정 시간',
        example: '2024-12-04T09:30:00.000Z',
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        description: 'AI 감정 분석 점수 (각 감정별 0~1 사이 값)',
        type: EmotionScoresDto,
    })
    emotionScores?: Record<string, number>;

    @ApiPropertyOptional({
        description: '가장 높은 점수의 주요 감정',
        example: 'happy',
        enum: ['happy', 'sad', 'angry', 'calm', 'default'],
    })
    dominantEmotion?: string;

    @ApiPropertyOptional({
        description: 'AI 코멘트',
        example: '오늘 하루 정말 고생 많으셨어요.',
    })
    aiComment?: string;
}

export class DiaryListResponseDto {
    @ApiProperty({
        description: '일기 목록',
        type: [DiaryResponseDto],
    })
    diaries: DiaryResponseDto[];

    @ApiPropertyOptional({
        description: '다음 페이지 조회를 위한 마지막 일기 ID (페이지네이션용)',
        example: 'diary_xyz789',
    })
    lastDocId?: string;

    @ApiProperty({
        description: '더 많은 일기가 있는지 여부',
        example: true,
    })
    hasMore: boolean;
}
