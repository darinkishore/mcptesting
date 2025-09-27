'use client';

import { useState } from 'react';
import { ToolTask } from '../../mcp-types';
import { TaskTraceViewer } from './task-trace-viewer';

interface TaskListProps {
  tasks: ToolTask[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Task Results</h3>

      {tasks.map((task) => (
        <div
          key={task.id}
          className="border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left"
          >
            <div className="flex items-center space-x-4">
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  task.status === 'passed' ? 'bg-green-500' :
                  task.status === 'failed' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}
              />
              <div>
                <p className="font-medium">{task.name}</p>
                <p className="text-sm text-gray-500">{task.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {task.score}/{task.maxScore}
                </p>
                {task.executionTime && (
                  <p className="text-xs text-gray-500">{task.executionTime}ms</p>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedTask === task.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedTask === task.id && task.traces && (
            <div className="border-t px-4 py-3 bg-gray-50">
              <TaskTraceViewer traces={task.traces} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}