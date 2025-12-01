import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('DiaryGarden API')
    .setDescription('DiaryGarden backend API with AI emotion analysis')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 DiaryGarden API is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
bootstrap();
