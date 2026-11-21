import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { FinanceGateway } from '../src/finance.ts'
import { fakeFinance, fixedClock } from './helpers.ts'

describe('STORY-003-v6 / FR-003 idempotent finance enqueue', () => {
  it('STORY-003-v6: sends a validated order to finance once with its stable key', async () => {
    const finance = fakeFinance()
    const gateway = new FinanceGateway(finance.api, fixedClock, 50)
    const result = await gateway.enqueueOnce('BEA-1001', 'ord_stable')
    assert.equal(result.status, 'enqueued')
    assert.deepEqual(finance.calls, [{ orderId: 'BEA-1001', idempotencyKey: 'ord_stable' }])
  })

  it('STORY-003-v6: creates no second finance entry when the same key is sent again', async () => {
    const finance = fakeFinance()
    const gateway = new FinanceGateway(finance.api, fixedClock, 50)
    const first = await gateway.enqueueOnce('BEA-1001', 'ord_stable')
    const again = await gateway.enqueueOnce('BEA-1001', 'ord_stable')
    assert.deepEqual(again, first)
    assert.equal(finance.calls.length, 1)
  })

  it('STORY-003-v6: keeps a timeout visible with reason, key and time', async () => {
    const gateway = new FinanceGateway(fakeFinance('hang').api, fixedClock, 20)
    const result = await gateway.enqueueOnce('BEA-1001', 'ord_stable')
    assert.equal(result.status, 'timeout')
    assert.ok('reason' in result && result.reason && result.followUp)
    assert.equal(result.key, 'ord_stable')
    assert.equal(result.at, '2026-11-11T09:00:00.000Z')
  })
})
