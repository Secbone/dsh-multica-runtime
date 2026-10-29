/** Return the one credential DSH child tools may receive from Multica. */
export function multicaTerminalEnvironment(environment) {
    const token = environment.MULTICA_TOKEN;
    return token?.startsWith('mat_') === true && token.length > 4
        ? { MULTICA_TOKEN: token }
        : {};
}
//# sourceMappingURL=task-env.js.map