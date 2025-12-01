import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface EmotionAnalysisResponse {
    emotionScores: Record<string, number>;
    dominantEmotion: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiServiceUrl: string;

    constructor(private configService: ConfigService) {
        this.aiServiceUrl = this.configService.get('AI_SERVICE_URL') || 'http://localhost:8000/emotions';
    }

    async analyzeEmotion(content: string, title?: string): Promise<EmotionAnalysisResponse> {
        try {
            const response = await axios.post(
                this.aiServiceUrl,
                {
                    text: content,
                    title: title || '',
                },
                {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            const { emotionScores, dominantEmotion } = response.data;

            if (!emotionScores || !dominantEmotion) {
                throw new Error('Invalid response format from AI service');
            }

            return {
                emotionScores,
                dominantEmotion,
            };
        } catch (error) {
            this.logger.error('Failed to analyze emotion', error);

            // Return default emotion if AI service fails
            this.logger.warn('Using default emotion scores due to AI service failure');
            return {
                emotionScores: {
                    neutral: 1.0,
                },
                dominantEmotion: 'neutral',
            };
        }
    }
}
