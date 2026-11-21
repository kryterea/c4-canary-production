import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  acknowledge,
  acknowledgementControl,
  confirmFinanceImport,
} from '../src/acknowledgement.ts'
import type { OrderRecord } from '../src/types.ts'
import { coordinator, fixedClock } from './helpers.ts'

const sent: OrderRecord = {
  orderId: 'BEA-1001',
  key: 'ord_stable',
  importStatus: 'pending',
  financeConfirmed: false,
  acknowledged: false,
  history: [],
}

describe('STORY-004-v6 / FR-004 confirm import and control acknowledgement', () => {
  it('STORY-004-v6: marks the order accepted and enables acknowledgement once finance confirms', () => {
    const confirmed = confirmFinanceImport(sent, { entryId: 'FIN-1' }, fixedClock)
    assert.equal(confirmed.importStatus, 'accepted')
    assert.equal(acknowledgementControl(confirmed).enabled, true)
  })

  it('STORY-004-v6: keeps acknowledgement disabled with guidance until finance confirms', () => {
    const control = acknowledgementControl(sent)
    assert.equal(control.enabled, false)
    assert.match(control.guidance, /escalate/)
  })

  it('STORY-004-v6: does not mark the order accepted on a coordinator acknowledgement alone', () => {
    const after = acknowledge(sent, coordinator, fixedClock)
    assert.equal(after.importStatus, 'pending')
    assert.equal(after.acknowledged, false)
  })
})
