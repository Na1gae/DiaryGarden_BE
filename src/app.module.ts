import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { DiaryModule } from './diary/diary.module';
import { GardenModule } from './garden/garden.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 1 minute
    }),
    PrismaModule,
    AuthModule,
    AiModule,
    DiaryModule,
    GardenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
