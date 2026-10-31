import type { Database } from '@allfina/db';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ENV, type Env } from '../config/env';
import { DB } from '../database/database.module';
import { AUTH, createAuth } from './auth';
import { AuthGuard } from './auth.guard';

@Global()
@Module({
  providers: [
    {
      provide: AUTH,
      inject: [DB, ENV],
      useFactory: (db: Database, env: Env) => createAuth(db, env),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH],
})
export class AuthModule {}
