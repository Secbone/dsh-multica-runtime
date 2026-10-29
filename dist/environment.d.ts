import type { Context } from '@deepseek-ai/cordis';
/** What {@link installMulticaTerminalEnvironment} actually achieved. */
export interface TerminalEnvironmentReport {
    /** How many distinct scrub instances now exempt the task token. */
    patched: number;
    /** Whether the task token survives the scrub DSH is going to apply. */
    forwarded: boolean;
}
/**
 * Exempt the task token on every scrub instance supplied, deduplicated by
 * object identity.
 *
 * The plural matters. Patching a matcher only affects the module instance that
 * matcher belongs to, and a bridge loaded through a `link:` dependency resolves
 * its own copy of `@deepseek-ai/dsh-subprocess` rather than the copy the DSH
 * launcher loaded. Patching only the statically imported one left the real
 * scrub untouched, the token stripped, and every in-task `multica` command
 * refused for want of a `mat_` credential (MUL-6186). Nothing about that
 * failure was visible until an agent tried to use the CLI.
 * @param patterns - scrub matchers to exempt; duplicates are patched once.
 * @returns the instance count and a disposer restoring all of them.
 */
export declare function exemptTaskTokenOn(patterns: Iterable<RegExp>): {
    patched: number;
    dispose: () => void;
};
/**
 * Let the current task's `mat_` token — and nothing else — reach the shell
 * tools, on whichever dsh-subprocess instances are reachable from here.
 * @param ctx - the Cordis context whose disposal restores the scrub.
 * @param entrypoint - the launcher script to resolve DSH's own copy from.
 * @returns what was installed, or undefined when there is no task token to forward.
 */
export declare function installMulticaTerminalEnvironment(ctx: Context, entrypoint?: string | undefined): Promise<TerminalEnvironmentReport | undefined>;
export { multicaTerminalEnvironment } from './task-env.js';
//# sourceMappingURL=environment.d.ts.map