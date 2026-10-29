/**
 * Wait until the root agent and its subagents are quiescent.
 *
 * DSH 0.2 uses an activation model: a finished child notifies the parent,
 * which then runs another round. A single `whenIdle()` would emit the result
 * before those rounds, so loop like DSH's own headless runner and SDK server
 * until the root stays idle across a child check with no new session events.
 *
 * Cancellation returns immediately without waiting on the agent again: a
 * child settling right after the cancel can wake the parent for a fresh round
 * that `whenIdle()` would follow. The caller must then run
 * {@link settleCancelled}, which stops descendants before converging the root.
 * @param subagents - DSH's subagent service, absent when the profile mounts none.
 * @param agent - the task's root agent.
 * @param signal - aborted when Multica cancels the task.
 * @returns `'cancelled'` when the signal aborted, `'settled'` otherwise.
 */
export async function waitForQuiescence(subagents, agent, signal) {
    const aborted = new Promise((resolveAborted) => {
        if (signal.aborted)
            resolveAborted('aborted');
        else
            signal.addEventListener('abort', () => resolveAborted('aborted'), { once: true });
    });
    while (true) {
        if (await Promise.race([agent.whenIdle(), aborted]) === 'aborted')
            return 'cancelled';
        const idleSeq = agent.session.seq;
        // Child settlement can wake the parent before the child wait observes it.
        const children = await Promise.race([subagents?.waitForChildren(agent) ?? false, aborted]);
        if (children === 'aborted')
            return 'cancelled';
        if (!children && agent.status === 'idle' && agent.session.seq === idleSeq)
            return 'settled';
    }
}
/**
 * Converge a cancelled root agent without joining child-woken rounds.
 *
 * Descendants are drained first so no child can deliver another wake-up;
 * then the root is cancelled until it is idle. `cancel()` clears queued work
 * and aborts the active activity, so input a child delivered before the drain
 * is discarded instead of starting a new model round.
 * @param subagents - DSH's subagent service, absent when the profile mounts none.
 * @param agent - the task's root agent.
 * @param onDrainError - reports a drain failure; convergence continues regardless.
 */
export async function settleCancelled(subagents, agent, onDrainError) {
    agent.cancel({ kind: 'user' });
    try {
        await subagents?.drainDescendants([agent]);
    }
    catch (error) {
        onDrainError(error);
    }
    do {
        agent.cancel({ kind: 'user' });
        await agent.whenIdle();
    } while (agent.status !== 'idle');
}
//# sourceMappingURL=lifecycle.js.map