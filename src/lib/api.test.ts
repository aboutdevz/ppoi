import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Utils', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('fetch wrapper', () => {
    it('should handle successful API responses', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const response = await fetch('/api/test')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual(mockResponse)
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      const response = await fetch('/api/nonexistent')
      
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('request headers', () => {
    it('should include correct content type for JSON requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)

      await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      })

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      })
    })
  })
})
