import { TaskTrace } from '../../mcp-types';

interface TraceMessageProps {
  trace: TaskTrace;
}

export function TraceMessage({ trace }: TraceMessageProps) {
  const bgColor =
    trace.type === 'request' ? 'bg-blue-50' :
    trace.type === 'response' ? 'bg-green-50' :
    'bg-red-50';

  const borderColor =
    trace.type === 'request' ? 'border-blue-200' :
    trace.type === 'response' ? 'border-green-200' :
    'border-red-200';

  const icon =
    trace.type === 'request' ? '→' :
    trace.type === 'response' ? '←' :
    '⚠';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-3`}>
      <div className="flex items-start space-x-2">
        <span className="text-gray-500 font-mono text-sm">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium capitalize">{trace.type}</span>
            <span className="text-xs text-gray-500">
              {new Date(trace.timestamp).toISOString().slice(11, 19)}
            </span>
          </div>
          <pre className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
            {JSON.stringify(trace.content, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}