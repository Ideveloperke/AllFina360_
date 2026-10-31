import { auditLogs, type Database } from '@allfina/db';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB } from '../database/database.module';

export interface AuditEvent {
  firmId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DB) private readonly db: Database) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({ ...event, metadata: event.metadata ?? {} });
    } catch (err) {
      // Audit failures must be visible but should not break the user request.
      this.logger.error(`Failed to write audit log for ${event.action}`, err as Error);
    }
  }
}
