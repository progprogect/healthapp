'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const testAPI = async () => {
    try {
      setApiError(null);
      const response = await fetch('/api/requests/mine');
      const data = await response.json();
      setApiResponse({ status: response.status, data });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Auth</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p>Status: {status}</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">API Test</h2>
          <button
            onClick={testAPI}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test /api/requests/mine
          </button>
          
          {apiResponse && (
            <div className="mt-4">
              <h3 className="font-medium">API Response:</h3>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
          
          {apiError && (
            <div className="mt-4">
              <h3 className="font-medium text-red-600">API Error:</h3>
              <p className="text-red-600">{apiError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

