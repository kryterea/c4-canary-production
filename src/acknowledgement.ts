// STORY-004-v6 Confirm import and control acknowledgement (traces to FR-004).
import type { Actor, Clock, OrderRecord } from './types.ts'

/** Records the Finance API's confirmation. Only this marks an order accepted. */
export function confirmFinanceImport(
  record: OrderRecord,
  confirmation: { entryId: string },
  clock: Clock,
): OrderRecord {
  return {
    ...record,
    financeConfirmed: true,
    importStatus: 'accepted',
    history: [
      ...record.history,
      {
        at: clock().toISOString(),
        step: 'confirmation',
        outcome: `confirmed_${confirmation.entryId}`,
        actorId: 'finance-api',
      },
    ],
  }
}

/** Acknowledgement is enabled only once the Finance API has confirmed the import. */
export function acknowledgementControl(record: OrderRecord): {
  enabled: boolean
  guidance: string
} {
  return record.financeConfirmed
    ? { enabled: true, guidance: 'Finance has confirmed the import. You can acknowledge it.' }
    : {
        enabled: false,
        guidance:
          'Waiting for the Finance API to confirm the import. Check its status or escalate.',
      }
}

/**
 * A coordinator acknowledges a confirmed order. Without a finance confirmation the
 * acknowledgement is refused and the status does not change.
 */
export function acknowledge(record: OrderRecord, actor: Actor, clock: Clock): OrderRecord {
  if (!record.financeConfirmed) return record
  return {
    ...record,
    acknowledged: true,
    history: [
      ...record.history,
      {
        at: clock().toISOString(),
        step: 'acknowledgement',
        outcome: 'acknowledged',
        actorId: actor.id,
      },
    ],
  }
}
