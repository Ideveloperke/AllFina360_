import { clients, type Database } from '@allfina/db';
import type { CreateClientInput, UpdateClientInput } from '@allfina/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.guard';
import { DB } from '../database/database.module';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly audit: AuditService,
  ) {}

  list(user: AuthUser) {
    return this.db
      .select()
      .from(clients)
      .where(eq(clients.firmId, user.firmId))
      .orderBy(asc(clients.lastName), asc(clients.firstName));
  }

  async get(user: AuthUser, id: string) {
    const [client] = await this.db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, user.firmId), eq(clients.id, id)));
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(user: AuthUser, input: CreateClientInput) {
    const [client] = await this.db
      .insert(clients)
      .values({ ...input, firmId: user.firmId, advisorId: user.id })
      .returning();
    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'client.created',
      entityType: 'client',
      entityId: client!.id,
    });
    return client!;
  }

  async update(user: AuthUser, id: string, input: UpdateClientInput) {
    const [client] = await this.db
      .update(clients)
      .set(input)
      .where(and(eq(clients.firmId, user.firmId), eq(clients.id, id)))
      .returning();
    if (!client) throw new NotFoundException('Client not found');
    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'client.updated',
      entityType: 'client',
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });
    return client;
  }

  async remove(user: AuthUser, id: string) {
    const [client] = await this.db
      .delete(clients)
      .where(and(eq(clients.firmId, user.firmId), eq(clients.id, id)))
      .returning({ id: clients.id });
    if (!client) throw new NotFoundException('Client not found');
    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'client.deleted',
      entityType: 'client',
      entityId: id,
    });
  }
}
