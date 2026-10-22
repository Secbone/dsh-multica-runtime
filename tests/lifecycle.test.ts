import { describe, expect, it, vi } from 'vitest'
import { waitForQuiescence, type QuiescentAgent, type SubagentLifecycle } from '../src/lifecycle.js'

/** A root agent whose session seq a test advances to simulate new rounds. */
interface FakeAgent {
  status: QuiescentAgent['status']
  session: { seq: number }
  whenIdle: ReturnType<typeof vi.fn<() => Promise<void>>>
}

function fakeAgent(): FakeAgent {
  return { status: 'idle', session: { seq: 0 }, whenIdle: vi.fn(() => Promise.resolve()) }
}

/** View the mutable fake through the loop's read-only contract. */
function view(agent: FakeAgent): QuiescentAgent {
  return agent as unknown as QuiescentAgent
}

function lifecycle(waitForChildren: SubagentLifecycle['waitForChildren']): SubagentLifecycle {
  return { waitForChildren, drainDescendants: vi.fn(() => Promise.resolve()) }
}

describe('waitForQuiescence', () => {
  it('returns after one idle check when the profile mounts no subagents', async () => {
    const agent = fakeAgent()
    await waitForQuiescence(undefined, view(agent), new AbortController().signal)
    expect(agent.whenIdle).toHaveBeenCalledTimes(1)
  })

  it('keeps waiting while settled children wake the parent for more rounds', async () => {
    const agent = fakeAgent()
    // Two children settle in turn; each wakes the parent, which appends events.
    let pending = 2
    const subagents = lifecycle(vi.fn(() => {
      if (pending === 0) return Promise.resolve(false)
      pending -= 1
      agent.session.seq += 1
      return Promise.resolve(true)
    }))

    await waitForQuiescence(subagents, view(agent), new AbortController().signal)

    expect(subagents.waitForChildren).toHaveBeenCalledTimes(3)
    expect(agent.whenIdle).toHaveBeenCalledTimes(3)
  })

  it('loops again when the parent woke between idle and the child check', async () => {
    const agent = fakeAgent()
    let raced = false
    const subagents = lifecycle(vi.fn(() => {
      if (!raced) {
        // A child settled and its notification already appended to the parent.
        raced = true
        agent.session.seq += 1
      }
      return Promise.resolve(false)
    }))

    await waitForQuiescence(subagents, view(agent), new AbortController().signal)

    expect(agent.whenIdle).toHaveBeenCalledTimes(2)
  })

  it('stops waiting on children once the task is cancelled', async () => {
    const agent = fakeAgent()
    const cancel = new AbortController()
    // A child that never settles on its own.
    const subagents = lifecycle(vi.fn(() => new Promise<boolean>(() => {})))

    const done = waitForQuiescence(subagents, view(agent), cancel.signal)
    cancel.abort()

    await expect(done).resolves.toBeUndefined()
  })
})
