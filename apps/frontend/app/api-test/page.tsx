'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { HealthResponse, HelloResponse } from '@/types/api';

export default function ApiTestPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [hello, setHello] = useState<HelloResponse | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    const response = await api.getHealth();
    if (response.success && response.data) {
      setHealth(response.data);
    } else {
      setError(response.error);
    }
    setLoading(false);
  };

  const sayHello = async () => {
    setLoading(true);
    setError(null);
    const response = await api.sayHello({ name: name || undefined });
    if (response.success && response.data) {
      setHello(response.data);
    } else {
      setError(response.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">API Test Page</h1>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Backend Health Check</h2>
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {health && (
            <div className="bg-green-50 p-4 rounded">
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Version:</strong> {health.version}</p>
              <p><strong>Service:</strong> {health.service}</p>
            </div>
          )}
          <button
            onClick={checkHealth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Refresh Health
          </button>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Hello API</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={sayHello}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              Say Hello
            </button>
          </div>
          {hello && (
            <div className="bg-blue-50 p-4 rounded">
              <p>{hello.message}</p>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <p>Make sure your backend is running:</p>
          <code className="bg-gray-100 px-2 py-1 rounded">
            uv run --directory apps/backend uvicorn backend.main:app --reload --port 8000
          </code>
        </div>
      </div>
    </div>
  );
}