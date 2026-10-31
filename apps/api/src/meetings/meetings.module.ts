import { Module } from '@nestjs/common';
import { MeetingProcessor } from './meeting.processor';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingProcessor],
})
export class MeetingsModule {}
