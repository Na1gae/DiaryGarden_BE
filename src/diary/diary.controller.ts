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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
    ApiUnauthorizedResponse,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { DiaryResponseDto, DiaryListResponseDto } from './dto/diary-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HttpCacheInterceptor } from '../common/interceptors/http-cache.interceptor';

@ApiTags('일기 (Diary)')
@Controller('api/diaries')
@UseInterceptors(HttpCacheInterceptor)
export class DiaryController {
    constructor(private readonly diaryService: DiaryService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '일기 작성',
        description: '새로운 일기를 작성합니다. AI가 자동으로 감정 분석을 수행하고, 해당 월의 나무에 일기가 연결됩니다.',
    })
    @ApiResponse({
        status: 201,
        description: '일기 작성 성공',
        type: DiaryResponseDto,
    })
    @ApiBadRequestResponse({
        description: '잘못된 요청 (유효성 검사 실패)',
    })
    @ApiUnauthorizedResponse({
        description: '인증 필요 (토큰 없음 또는 만료)',
    })
    async createDiary(
        @CurrentUser() user: { userId: string },
        @Body() createDiaryDto: CreateDiaryDto,
    ) {
        return this.diaryService.createDiary(user.userId, createDiaryDto);
    }

    @Get(':id')
    @ApiOperation({
        summary: '일기 상세 조회',
        description: '특정 일기의 상세 내용을 조회합니다. 공개 일기는 인증 없이 조회 가능합니다.',
    })
    @ApiParam({
        name: 'id',
        description: '조회할 일기의 고유 ID',
        example: 'diary_abc123',
    })
    @ApiResponse({
        status: 200,
        description: '일기 조회 성공',
        type: DiaryResponseDto,
    })
    @ApiNotFoundResponse({
        description: '일기를 찾을 수 없음',
    })
    async getDiary(
        @Param('id') id: string,
        @CurrentUser() user?: { userId: string },
    ) {
        return this.diaryService.getDiary(id, user?.userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: '일기 목록 조회',
        description: '로그인한 사용자의 일기 목록을 조회합니다. 다양한 필터와 페이지네이션을 지원합니다.',
    })
    @ApiQuery({
        name: 'limit',
        description: '한 번에 가져올 일기 수 (0이면 전체 조회)',
        required: false,
        type: Number,
        example: 10,
    })
    @ApiQuery({
        name: 'lastDocId',
        description: '페이지네이션: 이전 조회의 마지막 일기 ID',
        required: false,
        type: String,
    })
    @ApiQuery({
        name: 'updatedAfter',
        description: '이 시간 이후 수정된 일기만 조회 (ISO 8601 형식)',
        required: false,
        type: String,
        example: '2024-01-01T00:00:00.000Z',
    })
    @ApiQuery({
        name: 'writtenAfter',
        description: '이 날짜 이후 작성된 일기만 조회 (ISO 8601 형식)',
        required: false,
        type: String,
        example: '2024-01-01',
    })
    @ApiQuery({
        name: 'writtenBefore',
        description: '이 날짜 이전 작성된 일기만 조회 (ISO 8601 형식)',
        required: false,
        type: String,
        example: '2024-12-31',
    })
    @ApiResponse({
        status: 200,
        description: '일기 목록 조회 성공',
        type: DiaryListResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: '인증 필요 (토큰 없음 또는 만료)',
    })
    async getDiaries(
        @CurrentUser() user: { userId: string },
        @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
        @Query('lastDocId') lastDocId?: string,
        @Query('updatedAfter') updatedAfter?: string,
        @Query('writtenAfter') writtenAfter?: string,
        @Query('writtenBefore') writtenBefore?: string,
    ) {
        return this.diaryService.getDiaries(user.userId, limit, lastDocId, updatedAfter, writtenAfter, writtenBefore);
    }
}
