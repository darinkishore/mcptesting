import { MCPServer } from '../mcp-types';

interface ServerHeaderProps {
  server: MCPServer;
}

export function ServerHeader({ server }: ServerHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="text-3xl font-bold text-gray-900">{server.name}</h1>
      <p className="text-gray-600 mt-1">{server.description}</p>
    </div>
  );
}