'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface ReportData {
  summary: {
    total: number
    totalTax: number
    totalSubtotal: number
    count: number
  }
  byCategory: Array<{
    category: string
    total: number
    count: number
    irsCategory: string | null
  }>
  byMonth: Array<{
    month: string
    total: number
    count: number
  }>
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#f97316', '#84cc16']

export default function ReportsView() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchReport()
  }, [reportType, startDate, endDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('type', reportType)
      if (reportType === 'custom') {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/receipts/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'pdf') => {
    // Implementation for export
    alert(`Export to ${format.toUpperCase()} coming soon!`)
  }

  if (loading) {
    return <div className="text-center py-12">Loading report...</div>
  }

  if (!reportData) {
    return <div className="text-center py-12">No data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Report Period</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-2 rounded ${reportType === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`px-4 py-2 rounded ${reportType === 'yearly' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            >
              This Year
            </button>
            <button
              onClick={() => setReportType('custom')}
              className={`px-4 py-2 rounded ${reportType === 'custom' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
            >
              Custom
            </button>
          </div>
        </div>
        {reportType === 'custom' && (
          <div className="flex gap-4">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2 border rounded"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-4 py-2 border rounded"
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold">${reportData.summary.total.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Tax</div>
          <div className="text-2xl font-bold">${reportData.summary.totalTax.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Subtotal</div>
          <div className="text-2xl font-bold">${reportData.summary.totalSubtotal.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Receipts</div>
          <div className="text-2xl font-bold">{reportData.summary.count}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.byCategory}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {reportData.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.byMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Category Breakdown</h3>
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Category</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-right p-2">Count</th>
                <th className="text-left p-2">IRS Category</th>
              </tr>
            </thead>
            <tbody>
              {reportData.byCategory.map((item, index) => (
                <tr key={item.category} className="border-b">
                  <td className="p-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {item.category}
                  </td>
                  <td className="text-right p-2 font-semibold">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="text-right p-2">{item.count}</td>
                  <td className="p-2 text-gray-600">{item.irsCategory || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


