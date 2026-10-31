import {
  createMeetingSchema,
  recordingUploadSchema,
  updateActionItemSchema,
  type CreateMeetingInput,
  type RecordingUploadInput,
  type UpdateActionItemInput,
} from '@allfina/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.meetings.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.meetings.get(user, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMeetingSchema)) body: CreateMeetingInput,
  ) {
    return this.meetings.create(user, body);
  }

  @Post(':id/recording-upload')
  createRecordingUpload(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(recordingUploadSchema)) body: RecordingUploadInput,
  ) {
    return this.meetings.createRecordingUpload(user, id, body);
  }

  @Post(':id/process')
  @HttpCode(202)
  process(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.meetings.process(user, id);
  }

  @Patch(':id/action-items/:itemId')
  updateActionItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ZodValidationPipe(updateActionItemSchema)) body: UpdateActionItemInput,
  ) {
    return this.meetings.updateActionItem(user, id, itemId, body.completed);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.meetings.remove(user, id);
  }
}
