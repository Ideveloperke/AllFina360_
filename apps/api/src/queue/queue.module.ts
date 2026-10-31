import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../config/env';

export const MEETING_QUEUE = 'meeting-processing';

export interface ProcessMeetingJob {
  meetingId: string;
  firmId: string;
}

/** Turn a redis:// URL into the connection options BullMQ (ioredis) expects. */
export function redisConnection(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
    tls: u.protocol === 'rediss:' ? {} : undefined,
  };
}

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        connection: redisConnection(env.REDIS_URL),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      }),
    }),
    BullModule.registerQueue({ name: MEETING_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
