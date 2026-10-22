import type { Agent } from '@deepseek-ai/dsh-agent'

/** The slice of DSH's optional `subagents` service this bridge drives. */
export interface SubagentLifecycle {
  /** Resolves true when a child settled and may have woken the parent for another round. */
  waitForChildren(parent: Agent): Promise<boolean>
  /** Interrupt and settle every managed descendant of the given roots. */
  drainDescendants(parents: readonly Agent[]): Promise<void>
}

/** The agent surface the quiescence loop reads. */
export type QuiescentAgent = Pick<Agent, 'whenIdle' | 'status'> & { readonly session: Pick<Agent['session'], 'seq'> }

/**
 * Wait until the root agent and its subagents are quiescent.
 *
 * DSH 0.2 uses an activation model: a finished child notifies the parent,
 * which then runs another round. A single `whenIdle()` would emit the result
 * before those rounds, so loop like DSH's own headless runner and SDK server
 * until the root stays idle across a child check with no new session events.
 * Cancellation stops waiting; the caller interrupts descendants afterwards.
 * @param subagents - DSH's subagent service, absent when the profile mounts none.
 * @param agent - the task's root agent.
 * @param signal - aborted when Multica cancels the task.
 */
export async function waitForQuiescence(
  subagents: SubagentLifecycle | undefined,
  agent: QuiescentAgent,
  signal: AbortSignal,
): Promise<void> {
  const aborted = new Promise<'aborted'>((resolveAborted) => {
    if (signal.aborted) resolveAborted('aborted')
    else signal.addEventListener('abort', () => resolveAborted('aborted'), { once: true })
  })
  while (true) {
    await agent.whenIdle()
    if (signal.aborted) return
    const idleSeq = agent.session.seq
    // Child settlement can wake the parent before the child wait observes it.
    const children = await Promise.race([subagents?.waitForChildren(agent as Agent) ?? false, aborted])
    if (children === 'aborted') {
      await agent.whenIdle()
      return
    }
    if (!children && agent.status === 'idle' && agent.session.seq === idleSeq) return
  }
}
