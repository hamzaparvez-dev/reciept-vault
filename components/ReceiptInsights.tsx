'use client'

import { useState, useEffect } from 'react'

interface ReceiptInsights {
  monthlySpending: number
  topMerchants: Array<{ name: string; count: number; total: number }>
  categoryBreakdown: Record<string, number>
  trends: string
  suggestions: string[]
  predictedNextMonth: number
}

export default function ReceiptInsights() {
  const [insights, setInsights] = useState<ReceiptInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/receipts/insights')
      .then(res => res.json())
      .then(data => {
        setInsights(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load insights:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-md border border-border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/4"></div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return null
  }

  return (
    <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">💡 Smart Insights</h2>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Monthly Spending</div>
          <div className="text-2xl font-bold text-card-foreground">
            ${insights.monthlySpending.toFixed(2)}
          </div>
          {insights.predictedNextMonth > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Predicted next month: ${insights.predictedNextMonth.toFixed(2)}
            </div>
          )}
        </div>

        {insights.trends && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-2">Trends</div>
            <p className="text-sm text-muted-foreground">{insights.trends}</p>
          </div>
        )}

        {insights.topMerchants.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-2">Top Merchants</div>
            <div className="space-y-1">
              {insights.topMerchants.slice(0, 3).map((merchant, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{merchant.name}</span>
                  <span className="font-semibold text-card-foreground">
                    ${merchant.total.toFixed(2)} ({merchant.count}x)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {insights.suggestions.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-2">Suggestions</div>
            <ul className="list-disc list-inside space-y-1">
              {insights.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(insights.categoryBreakdown).length > 0 && (
          <div>
            <div className="text-sm font-semibold text-foreground mb-2">By Category</div>
            <div className="space-y-1">
              {Object.entries(insights.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{category}</span>
                    <span className="font-semibold text-card-foreground">
                      ${amount.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

