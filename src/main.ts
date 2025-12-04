import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('DiaryGarden API')
    .setDescription(`
## 📚 DiaryGarden API 문서

DiaryGarden은 AI 감정 분석 기능이 포함된 일기 서비스입니다.

### 🌳 주요 기능
- **일기 작성**: 일기를 작성하면 AI가 자동으로 감정을 분석합니다
- **정원 관리**: 월별/연도별 정원에서 나무(일기)들의 위치를 관리합니다
- **사용자 인증**: JWT 기반 인증 시스템

### 🔐 인증 방법
1. \`/api/auth/register\` 또는 \`/api/auth/login\`으로 토큰을 발급받습니다
2. 발급받은 토큰을 \`Authorization: Bearer {token}\` 헤더에 포함하여 요청합니다
3. 토큰이 만료되면 \`/api/auth/refresh\`로 갱신합니다

### 📝 응답 형식
모든 API 응답은 다음 형식을 따릅니다:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-12-04T09:30:00.000Z"
}
\`\`\`

에러 발생 시:
\`\`\`json
{
  "success": false,
  "error": {
    "message": "에러 메시지",
    "statusCode": 400
  },
  "timestamp": "2024-12-04T09:30:00.000Z"
}
\`\`\`
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT 액세스 토큰을 입력하세요',
        in: 'header',
      },
      'access-token',
    )
    .addBearerAuth()
    .addTag('인증 (Auth)', '회원가입, 로그인, 토큰 관리 API')
    .addTag('일기 (Diary)', '일기 작성 및 조회 API')
    .addTag('정원 (Garden)', '정원 나무 위치 관리 API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'DiaryGarden API 문서',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 DiaryGarden API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
bootstrap();
