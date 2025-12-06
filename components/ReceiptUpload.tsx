'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

export default function ReceiptUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to upload receipt')
    } finally {
      setUploading(false)
    }
  }, [router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  })

  return (
    <div className="bg-card rounded-lg shadow-md border border-border p-6">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">Upload Receipt</h3>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="text-primary">Uploading and processing...</div>
        ) : (
          <>
            <div className="text-4xl mb-4">📄</div>
            <p className="text-muted-foreground">
              {isDragActive
                ? 'Drop the receipt here'
                : 'Drag & drop a receipt, or click to select'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports JPG, PNG, and PDF
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive-foreground rounded border border-destructive/20">
          {error}
        </div>
      )}
    </div>
  )
}


