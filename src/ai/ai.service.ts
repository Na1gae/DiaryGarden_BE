import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EMOTION_ANALYSIS_PROMPT } from './prompts';

export interface EmotionAnalysisResponse {
    emotionScores: Record<string, number>;
    dominantEmotion: string;
    aiComment?: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly aiServiceUrl: string;
    private readonly useGemini: boolean;
    private readonly geminiApiKey: string;

    constructor(private configService: ConfigService) {
        this.aiServiceUrl = this.configService.get('AI_SERVICE_URL') || 'http://localhost:8000/emotions';
        this.useGemini = this.configService.get('GEMINI') === 'true';
        this.geminiApiKey = this.configService.get('GEMINI_API_KEY');
    }

    async analyzeEmotion(content: string, title?: string): Promise<EmotionAnalysisResponse> {
        if (this.useGemini) {
            return this.analyzeWithGemini(content, title);
        }

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

            const { emotionScores, dominantEmotion, aiComment } = response.data;

            if (!emotionScores || !dominantEmotion) {
                throw new Error('Invalid response format from AI service');
            }

            return {
                emotionScores,
                dominantEmotion,
                aiComment,
            };
        } catch (error) {
            this.logger.error('Failed to analyze emotion', error);

            // Return default emotion if AI service fails
            this.logger.warn('Using default emotion scores due to AI service failure');
            return {
                emotionScores: {
                    happy: 0.25,
                    sad: 0.25,
                    angry: 0.25,
                    calm: 0.25,
                },
                dominantEmotion: 'default',
                aiComment: '감정 분석에 실패했습니다.',
            };
        }
    }

    private async analyzeWithGemini(content: string, title?: string): Promise<EmotionAnalysisResponse> {
        try {
            if (!this.geminiApiKey) {
                throw new Error('GEMINI_API_KEY is not configured');
            }

            const genAI = new GoogleGenerativeAI(this.geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

            const prompt = EMOTION_ANALYSIS_PROMPT
                .replace('{title}', title || '')
                .replace('{content}', content);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            const data = JSON.parse(jsonStr);

            if (!data.emotionScores || !data.dominantEmotion) {
                 throw new Error('Invalid response format from Gemini');
            }

            // Normalize scores
            const scores = data.emotionScores as Record<string, number>;
            const total = Object.values(scores).reduce((sum: number, score: number) => sum + score, 0);
            const normalizedScores: Record<string, number> = {};
            
            if (total > 0) {
                for (const [key, value] of Object.entries(scores)) {
                    normalizedScores[key] = Number((value / total).toFixed(2));
                }
            } else {
                 // If total is 0, distribute evenly
                 const count = Object.keys(scores).length;
                 for (const key of Object.keys(scores)) {
                     normalizedScores[key] = 1 / count;
                 }
            }

            return {
                emotionScores: normalizedScores,
                dominantEmotion: data.dominantEmotion,
                aiComment: data.aiComment,
            };

        } catch (error) {
             this.logger.error('Failed to analyze emotion with Gemini', error);
             // Fallback to default
             return {
                emotionScores: {
                    happy: 0.25,
                    sad: 0.25,
                    angry: 0.25,
                    calm: 0.25,
                },
                dominantEmotion: 'default',
                aiComment: 'AI 서비스 연결에 실패했습니다.',
            };
        }
    }
}
