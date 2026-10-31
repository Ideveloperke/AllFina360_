import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { MeetingsModule } from './meetings/meetings.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    AuditModule,
    StorageModule,
    AiModule,
    QueueModule,
    ClientsModule,
    MeetingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
