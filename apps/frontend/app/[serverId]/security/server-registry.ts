export interface SecurityServerConfig {
  id: string;
  name: string;
  url: string;
  description?: string;
  repository?: string;
  headers?: Record<string, string>;
  protocolVersion?: string;
}

const SMITHERY_WIKIPEDIA_URL =
  process.env.NEXT_PUBLIC_WIKIPEDIA_MCP_URL ??
  'https://server.smithery.ai/@geobio/wikipedia-mcp/mcp?api_key=769d0b5c-c4d2-4aad-914d-59c5ce933c1d&profile=round-engineer-r0MxuG';

const SMITHERY_WIKIPEDIA_HEADERS: Record<string, string> = (() => {
  const apiKey = process.env.NEXT_PUBLIC_WIKIPEDIA_MCP_API_KEY;
  if (apiKey) {
    return { 'x-smithery-api-key': apiKey };
  }
  return {};
})();

const SERVER_REGISTRY: Record<string, SecurityServerConfig> = {
  wikipedia: {
    id: 'wikipedia',
    name: 'Wikipedia MCP (Smithery)',
    url: SMITHERY_WIKIPEDIA_URL,
    description: 'HTTP MCP server backed by Wikipedia content via Smithery.',
    repository: 'https://smithery.ai',
    headers: SMITHERY_WIKIPEDIA_HEADERS,
    protocolVersion: '2025-06-18',
  },
};

export function getSecurityServerConfig(serverId: string): SecurityServerConfig | null {
  const normalized = serverId.toLowerCase();
  return SERVER_REGISTRY[normalized] ?? null;
}
