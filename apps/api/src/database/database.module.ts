import { createDb, type Database } from '@allfina/db';
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ENV, type Env } from '../config/env';

export const DB = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [ENV],
      useFactory: (env: Env) => createDb(env.DATABASE_URL),
    },
  ],
  exports: [DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DB) private readonly db: Database) {}

  async onApplicationShutdown() {
    await this.db.$client.end();
  }
}
