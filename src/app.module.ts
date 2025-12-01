import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { DiaryModule } from './diary/diary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    AiModule,
    DiaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
