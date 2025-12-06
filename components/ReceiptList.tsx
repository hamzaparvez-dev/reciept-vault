'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Receipt {
  id: string
  merchant: string
  date: string
  total: number
  tax: number | null
  category: {
    id: string
    name: string
    color: string | null
  } | null
  tags: string[]
}

interface ReceiptListProps {
  initialReceipts: Receipt[]
}

export default function ReceiptList({ initialReceipts }: ReceiptListProps) {
  const [receipts, setReceipts] = useState(initialReceipts)
  const [search, setSearch] = useState('')
  const [filteredReceipts, setFilteredReceipts] = useState(receipts)

  useEffect(() => {
    if (!search) {
      setFilteredReceipts(receipts)
      return
    }

    const filtered = receipts.filter(
      r =>
        r.merchant.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.name.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredReceipts(filtered)
  }, [search, receipts])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return

    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReceipts(receipts.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (receipts.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-md border border-border p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-muted-foreground">No receipts yet. Upload your first receipt to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-md border border-border">
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="Search receipts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="divide-y divide-border">
        {filteredReceipts.map(receipt => (
          <div key={receipt.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-card-foreground">{receipt.merchant}</h3>
                  {receipt.category && (
                    <span
                      className="px-2 py-1 text-xs rounded-full text-white"
                      style={{
                        backgroundColor: receipt.category.color || 'var(--primary)',
                      }}
                    >
                      {receipt.category.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{format(new Date(receipt.date), 'MMM d, yyyy')}</span>
                  <span className="font-semibold text-card-foreground">
                    ${receipt.total.toFixed(2)}
                  </span>
                  {receipt.tax && receipt.tax > 0 && (
                    <span className="text-muted-foreground">Tax: ${receipt.tax.toFixed(2)}</span>
                  )}
                </div>
                {receipt.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {receipt.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/receipts/${receipt.id}`}
                  className="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(receipt.id)}
                  className="px-4 py-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


