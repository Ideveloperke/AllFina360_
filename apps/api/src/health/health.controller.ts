import type { Database } from '@allfina/db';
import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from '../auth/decorators';
import { DB } from '../database/database.module';

@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  async check() {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up' };
  }
}
