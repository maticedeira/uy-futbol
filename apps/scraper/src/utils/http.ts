import type { AxiosInstance } from 'axios';
import axios from 'axios'
import { SCRAPING_DELAY_MS, MAX_RETRIES } from '../config.js'

class HttpClient {
  private client: AxiosInstance
  private lastRequest = 0

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL, timeout: 30000 })
  }

  async get<T>(url: string): Promise<T> {
    await this.throttle()

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.get<T>(url)
        return response.data
      } catch (error) {
        lastError = error as Error
        const delay = Math.pow(2, attempt) * 1000
        console.log(`Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`)
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  private async throttle() {
    const now = Date.now()
    const elapsed = now - this.lastRequest
    if (elapsed < SCRAPING_DELAY_MS) {
      await this.sleep(SCRAPING_DELAY_MS - elapsed)
    }
    this.lastRequest = Date.now()
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const promiedosClient = new HttpClient('https://www.promiedos.com.ar')
export const transfermarktClient = new HttpClient(
  'https://www.transfermarkt.com',
)
