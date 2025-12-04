'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Receipt {
  id: string
  merchant: string
  date: string
  total: number
  tax: number | null
  subtotal: number | null
  items: Array<{ name: string; price: number; quantity: number }> | null
  paymentMethod: string | null
  category: {
    id: string
    name: string
    color: string | null
  } | null
  tags: string[]
  notes: string | null
  imageUrl: string
  warrantyExpiresAt: string | null
  warrantyItem: string | null
}

interface ReceiptDetailProps {
  receipt: Receipt
}

export default function ReceiptDetail({ receipt: initialReceipt }: ReceiptDetailProps) {
  const [receipt, setReceipt] = useState(initialReceipt)
  const [editing, setEditing] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: formData.get('merchant'),
          date: formData.get('date'),
          total: parseFloat(formData.get('total') as string),
          tax: parseFloat(formData.get('tax') as string) || 0,
          categoryId: formData.get('categoryId') || null,
          tags: formData.get('tags'),
          notes: formData.get('notes'),
          warrantyExpiresAt: formData.get('warrantyExpiresAt') || null,
          warrantyItem: formData.get('warrantyItem') || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setReceipt(data.receipt)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to update receipt:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this receipt?')) return

    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to delete receipt:', error)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
          ← Back to Dashboard
        </Link>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Receipt Image</h2>
          <img
            src={receipt.imageUrl}
            alt={receipt.merchant}
            className="w-full rounded-lg border"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Receipt Details</h2>
          {editing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  name="merchant"
                  defaultValue={receipt.merchant}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={format(new Date(receipt.date), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    name="total"
                    step="0.01"
                    defaultValue={receipt.total}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax
                  </label>
                  <input
                    type="number"
                    name="tax"
                    step="0.01"
                    defaultValue={receipt.tax || 0}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="categoryId"
                  defaultValue={receipt.category?.id || ''}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">None</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={receipt.tags.join(', ')}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  defaultValue={receipt.notes || ''}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Item
                </label>
                <input
                  type="text"
                  name="warrantyItem"
                  defaultValue={receipt.warrantyItem || ''}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Expires
                </label>
                <input
                  type="date"
                  name="warrantyExpiresAt"
                  defaultValue={
                    receipt.warrantyExpiresAt
                      ? format(new Date(receipt.warrantyExpiresAt), 'yyyy-MM-dd')
                      : ''
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Merchant</div>
                <div className="text-lg font-semibold">{receipt.merchant}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Date</div>
                <div className="text-lg">{format(new Date(receipt.date), 'MMMM d, yyyy')}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-bold">${receipt.total.toFixed(2)}</div>
                </div>
                {receipt.tax && receipt.tax > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">Tax</div>
                    <div className="text-lg">${receipt.tax.toFixed(2)}</div>
                  </div>
                )}
              </div>
              {receipt.category && (
                <div>
                  <div className="text-sm text-gray-600">Category</div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-white text-sm"
                    style={{
                      backgroundColor: receipt.category.color || '#3b82f6',
                    }}
                  >
                    {receipt.category.name}
                  </span>
                </div>
              )}
              {receipt.paymentMethod && (
                <div>
                  <div className="text-sm text-gray-600">Payment Method</div>
                  <div className="text-lg">{receipt.paymentMethod}</div>
                </div>
              )}
              {receipt.tags.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600">Tags</div>
                  <div className="flex gap-2 flex-wrap">
                    {receipt.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {receipt.notes && (
                <div>
                  <div className="text-sm text-gray-600">Notes</div>
                  <div className="text-lg">{receipt.notes}</div>
                </div>
              )}
              {receipt.warrantyItem && (
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600">Warranty</div>
                  <div className="text-lg font-semibold">{receipt.warrantyItem}</div>
                  {receipt.warrantyExpiresAt && (
                    <div className="text-sm text-gray-600 mt-1">
                      Expires: {format(new Date(receipt.warrantyExpiresAt), 'MMMM d, yyyy')}
                    </div>
                  )}
                </div>
              )}
              {receipt.items && receipt.items.length > 0 && (
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Items</div>
                  <div className="space-y-2">
                    {receipt.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-semibold">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
