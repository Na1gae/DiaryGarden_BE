import { Injectable, Logger, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EMOTION_ANALYSIS_PROMPT, DIARY_COMMENT_PROMPT } from './prompts';

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

        // GEMINI!=true: Get emotion data from AI_SERVICE_URL, then generate comment with Gemini
        return this.analyzeWithExternalServiceAndGeminiComment(content, title);
    }

    /**
     * Fetches emotion data from external AI service, then generates comment using Gemini
     */
    private async analyzeWithExternalServiceAndGeminiComment(content: string, title?: string): Promise<EmotionAnalysisResponse> {
        let emotionScores: Record<string, number>;
        let dominantEmotion: string;

        try {
            // Step 1: Get emotion data from external AI service
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

            const data = response.data;

            if (!data.emotionScores || !data.dominantEmotion) {
                throw new Error('Invalid response format from AI service');
            }

            emotionScores = data.emotionScores;
            dominantEmotion = data.dominantEmotion;
        } catch (error) {
            this.logger.error('Failed to get emotion data from AI service', error);
            throw new InternalServerErrorException("AI 서비스 연결에 실패했습니다.");
        }

        // Step 2: Generate comment using Gemini
        let aiComment: string;
        try {
            aiComment = await this.generateCommentWithGemini(content, title, dominantEmotion);
        } catch (error) {
            this.logger.error('Failed to generate comment with Gemini', error);
            aiComment = '코멘트 생성에 실패했습니다.';
        }

        return {
            emotionScores,
            dominantEmotion,
            aiComment,
        };
    }

    /**
     * Generates only the diary comment using Gemini (without emotion analysis)
     */
    private async generateCommentWithGemini(content: string, title?: string, dominantEmotion?: string): Promise<string> {
        if (!this.geminiApiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const genAI = new GoogleGenerativeAI(this.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

        const prompt = DIARY_COMMENT_PROMPT
            .replace('{title}', title || '')
            .replace('{content}', content)
            .replace('{dominantEmotion}', dominantEmotion || 'unknown');

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        return text;
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

