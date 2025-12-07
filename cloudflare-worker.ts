/**
 * Cloudflare Worker for ReceiptVault Background Processing
 * 
 * This worker handles:
 * 1. Background OCR processing (so uploads return instantly)
 * 2. Scheduled cron jobs for processing pending receipts
 * 3. Edge caching for faster API responses
 * 
 * Deploy: wrangler publish
 * URL: red-queen-7495.hamzaparvez171.workers.dev
 */

export interface Env {
  API_URL: string // Your Vercel app URL (e.g., https://reciept-vault.vercel.app)
  CRON_SECRET: string // Secret for authenticating cron requests
  GEMINI_API_KEY?: string // Optional: Can process directly in worker
}

export default {
  /**
   * Handle HTTP requests
   * POST /process - Process a receipt in background
   * GET /health - Health check
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        worker: 'receiptvault-processor',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Background processing endpoint
    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        const { receiptId, imageUrl, userId } = await request.json()
        
        if (!receiptId || !imageUrl) {
          return new Response(JSON.stringify({ error: 'Missing receiptId or imageUrl' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        
        // Call your Vercel API to process the receipt
        const processResponse = await fetch(`${env.API_URL}/api/receipts/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.CRON_SECRET}`, // Use secret for auth
          },
          body: JSON.stringify({
            receiptId,
            imageUrl,
            userId,
          }),
        })
        
        if (!processResponse.ok) {
          const error = await processResponse.text()
          throw new Error(`Processing failed: ${error}`)
        }
        
        const result = await processResponse.json()
        
        return new Response(JSON.stringify({ 
          success: true, 
          receiptId,
          result 
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('Worker processing error:', error)
        return new Response(JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Processing failed' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    
    // Cache proxy for receipts API (optional - speeds up dashboard)
    if (url.pathname.startsWith('/api/receipts') && request.method === 'GET') {
      const cacheKey = new Request(request.url, request)
      const cache = caches.default
      
      // Check cache first
      let response = await cache.match(cacheKey)
      if (response) {
        return response
      }
      
      // Fetch from origin
      response = await fetch(`${env.API_URL}${url.pathname}${url.search}`, {
        headers: request.headers,
      })
      
      // Clone response and cache for 5 minutes
      const responseToCache = new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          'Cache-Control': 'public, max-age=300', // 5 minutes
        },
      })
      
      // Cache in background (using ctx.waitUntil if available)
      ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()))
      
      return responseToCache
    }
    
    return new Response('Not found', { status: 404 })
  },
  
  /**
   * Cron trigger - runs every 5 minutes
   * Processes any pending receipts that weren't processed immediately
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      console.log('Cron triggered at:', new Date().toISOString())
      
      // Call your Vercel API to process pending receipts
      const response = await fetch(`${env.API_URL}/api/cron/process-receipts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.CRON_SECRET}`,
        },
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Cron job failed:', error)
        throw new Error(`Cron processing failed: ${error}`)
      }
      
      const result = await response.json()
      console.log('Cron job completed:', result)
    } catch (error) {
      console.error('Cron job error:', error)
      // Don't throw - let it retry on next run
    }
  },
}

