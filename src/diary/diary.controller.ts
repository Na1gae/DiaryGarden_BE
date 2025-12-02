import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
    UseInterceptors,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HttpCacheInterceptor } from '../common/interceptors/http-cache.interceptor';

@Controller('api/diaries')
@UseInterceptors(HttpCacheInterceptor)
export class DiaryController {
    constructor(private readonly diaryService: DiaryService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createDiary(
        @CurrentUser() user: { userId: string },
        @Body() createDiaryDto: CreateDiaryDto,
    ) {
        return this.diaryService.createDiary(user.userId, createDiaryDto);
    }

    @Get(':id')
    async getDiary(
        @Param('id') id: string,
        @CurrentUser() user?: { userId: string },
    ) {
        return this.diaryService.getDiary(id, user?.userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getDiaries(
        @CurrentUser() user: { userId: string },
        @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
        @Query('lastDocId') lastDocId?: string,
        @Query('updatedAfter') updatedAfter?: string,
    ) {
        return this.diaryService.getDiaries(user.userId, limit, lastDocId, updatedAfter);
    }
}
