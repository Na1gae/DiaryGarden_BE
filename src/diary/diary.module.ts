import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [DiaryController],
    providers: [DiaryService],
})
export class DiaryModule { }
