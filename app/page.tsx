'use client'

import { useState, useEffect } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
  updated_at: string
}

interface FAQResponse {
  context: string
  items: FAQItem[]
}

export default function Home() {
  const [faqData, setFaqData] = useState<FAQResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFAQ = async (context: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/faq/${context}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setFaqData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">FAQlue Demo</h1>
      
      <div className="mb-6">
        <button
          onClick={() => fetchFAQ('designonstock')}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Design on Stock FAQ'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {faqData && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            FAQ for: {faqData.context}
          </h2>
          <div className="space-y-4">
            {faqData.items.map((item) => (
              <div key={item.id} className="border border-gray-300 rounded p-4">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{item.answer}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Updated: {new Date(item.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
