'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  subscriptionTier: string
}

interface Category {
  id: string
  name: string
  description: string | null
  irsCategory: string | null
  color: string | null
}

interface SettingsViewProps {
  user: User | null
  categories: Category[]
}

export default function SettingsView({ user, categories: initialCategories }: SettingsViewProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6')

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          color: newCategoryColor,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCategories([...categories, data.category])
        setNewCategoryName('')
      }
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="text-gray-900">{user?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Tier
            </label>
            <div className="text-gray-900 font-semibold">{user?.subscriptionTier}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                />
                <div className="flex-1">
                  <div className="font-medium">{category.name}</div>
                  {category.irsCategory && (
                    <div className="text-sm text-gray-500">{category.irsCategory}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Add New Category</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={e => setNewCategoryColor(e.target.value)}
                className="w-16 h-10 border rounded"
              />
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Email Forwarding</h2>
        <p className="text-gray-600 mb-4">
          Forward receipts to: <code className="bg-gray-100 px-2 py-1 rounded">receipts@receiptvault.com</code>
        </p>
        <p className="text-sm text-gray-500">
          Include your user ID in the subject line for automatic processing
        </p>
      </div>
    </div>
  )
}


