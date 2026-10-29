export declare const PROTOCOL_VERSION: 1;
export declare const MAX_COMMAND_BYTES: number;
export declare const MAX_TOOL_OUTPUT_BYTES: number;
export interface ModelSelectionInput {
    provider: string;
    id: string;
    reasoning_effort?: string;
}
interface McpServerBase {
    name: string;
    tool_call_timeout_ms?: number;
}
export interface StdioMcpServer extends McpServerBase {
    transport: 'stdio';
    command: string;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
}
export interface StreamableHttpMcpServer extends McpServerBase {
    transport: 'streamable-http';
    url: string;
    headers: Record<string, string>;
}
export type McpServerInput = StdioMcpServer | StreamableHttpMcpServer;
export interface ExecuteCommand {
    v: typeof PROTOCOL_VERSION;
    type: 'execute';
    request_id: string;
    cwd: string;
    prompt: string;
    resume_session_id?: string;
    model?: ModelSelectionInput;
    reasoning_effort?: string;
    mcp_servers: McpServerInput[];
}
export interface CancelCommand {
    v: typeof PROTOCOL_VERSION;
    type: 'cancel';
    request_id: string;
}
export type InboundCommand = ExecuteCommand | CancelCommand;
export interface RuntimeModelFrame {
    id: string;
    label: string;
    provider: string;
    default?: boolean;
    thinking?: {
        supported_levels: Array<{
            value: string;
            label: string;
            description?: string;
        }>;
        default_level?: string;
    };
}
export type OutboundFrame = {
    v: typeof PROTOCOL_VERSION;
    type: 'ready';
    runtime: 'dsh';
    plugin_version: string;
    capabilities: {
        resume: true;
        cancel: true;
        models: true;
        thinking: true;
        usage: true;
        tools: true;
        mcp: ['stdio', 'streamable-http'];
    };
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'probe';
    runtime: 'dsh';
    plugin_version: string;
    protocol_version: number;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'models';
    models: RuntimeModelFrame[];
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'session';
    request_id: string;
    session_id: string;
    resumed: boolean;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'text';
    request_id: string;
    content: string;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'thinking';
    request_id: string;
    content: string;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'tool_call';
    request_id: string;
    call_id: string;
    name: string;
    arguments: string;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'tool_result';
    request_id: string;
    call_id: string;
    name: string;
    output: string;
    is_error: boolean;
    truncated?: boolean;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'usage';
    request_id: string;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
    reasoning_tokens?: number;
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'result';
    request_id: string;
    status: 'completed' | 'failed' | 'aborted' | 'cancelled';
    session_id?: string;
    output: string;
    stop_reason?: string;
    resume_rejected: boolean;
    error?: {
        code: string;
        message: string;
    };
} | {
    v: typeof PROTOCOL_VERSION;
    type: 'protocol_error';
    code: string;
    message: string;
};
export declare function parseInboundCommand(line: string): InboundCommand;
export declare function normalizeMcpServerName(name: string): string;
export declare function truncateUtf8(value: string, maxBytes?: number): {
    value: string;
    truncated: boolean;
};
export declare function encodeFrame(frame: OutboundFrame): string;
export {};
//# sourceMappingURL=protocol.d.ts.map