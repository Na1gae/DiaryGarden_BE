export class DiaryResponseDto {
    id: string;
    userId: string;
    treeId: string;
    title: string;
    content: string;
    writtenDate: Date;
    createdAt: Date;
    updatedAt: Date;
    emotionScores?: Record<string, number>;
    dominantEmotion?: string;
}
