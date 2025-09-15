"use client";

import { useState } from "react";

export default function TestFAQ() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test the FAQ API
      const response = await fetch("/api/faq/designonstock");
      const data = await response.json();
      
      setTestResults({
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResults({
        error: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    setLoading(true);
    try {
      // Test search functionality
      const response = await fetch("/api/faq/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          context: "designonstock", 
          type: "search", 
          query: "bank" 
        }),
      });
      
      const data = await response.json();
      
      setTestResults({
        searchStatus: response.status,
        searchData: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResults({
        searchError: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testClick = async () => {
    setLoading(true);
    try {
      // Test click functionality
      const response = await fetch("/api/faq/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          context: "designonstock", 
          type: "click", 
          item_id: "test-item-123" 
        }),
      });
      
      const data = await response.json();
      
      setTestResults({
        clickStatus: response.status,
        clickData: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResults({
        clickError: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">FAQ Database Test</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test FAQ API"}
        </button>
        
        <button
          onClick={testSearch}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
        >
          {loading ? "Testing..." : "Test Search Logging"}
        </button>
        
        <button
          onClick={testClick}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
        >
          {loading ? "Testing..." : "Test Click Logging"}
        </button>
      </div>

      {testResults && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Next Steps:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Run the SQL script in your Supabase database</li>
          <li>Set up environment variables in Vercel</li>
          <li>Test the FAQ page at <code>/faq-demo/designonstock</code></li>
          <li>Take screenshots of the working system</li>
        </ol>
      </div>
    </div>
  );
}
