import { TaskTrace } from '../../mcp-types';
import { TraceMessage } from './trace-message';

interface TaskTraceViewerProps {
  traces: TaskTrace[];
}

export function TaskTraceViewer({ traces }: TaskTraceViewerProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Execution Trace</h4>
      <div className="space-y-2">
        {traces.map((trace, index) => (
          <TraceMessage key={index} trace={trace} />
        ))}
      </div>
    </div>
  );
}