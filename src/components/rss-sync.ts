// No longer need Firestore imports since we're using the API directly

// Types

interface SyncStats {
  total_items: number;
  new_items: number;
  updated_items: number;
  skipped_items: number;
  errors: number;
}

interface ProcessedSlugs {
  new_slugs: string[];
  updated_slugs: string[];
  skipped_slugs: string[];
  error_slugs: string[];
}

export interface SyncResult {
  success: boolean;
  stats: SyncStats;
  processed_slugs: ProcessedSlugs;
  message: string;
}

export const DEFAULT_RSS_URL = 'https://naveenkumarkakunuri.substack.com/feed';

export class RSSFirestoreSync {
  private rssUrl: string;
  private stats: SyncStats = {
    total_items: 0,
    new_items: 0,
    updated_items: 0,
    skipped_items: 0,
    errors: 0
  };
  private processedSlugs: ProcessedSlugs = {
    new_slugs: [],
    updated_slugs: [],
    skipped_slugs: [],
    error_slugs: []
  };

  constructor(rssUrl: string = DEFAULT_RSS_URL) {
    this.rssUrl = rssUrl;
  }

  /**
   * Call Firebase Cloud Function for RSS sync
   */
  private async callRSSSyncAPI(): Promise<any> {
    try {
      // Get the current user's auth token
      const { getAuth } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      const response = await fetch('https://us-central1-aicareerx-51133.cloudfunctions.net/rss_sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rss_url: this.rssUrl
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Error calling RSS sync API:', error);
      throw error;
    }
  }



  /**
   * Process API response and update stats
   */
  private processAPIResponse(apiResponse: any): void {
    if (apiResponse.status === 'success' && apiResponse.result) {
      const result = apiResponse.result;
      
      this.stats.total_items = result.total || 0;
      this.stats.new_items = result.new?.length || 0;
      this.stats.updated_items = result.updated?.length || 0;
      this.stats.skipped_items = result.skipped?.length || 0;
      this.stats.errors = result.errors?.length || 0;
      
      this.processedSlugs.new_slugs = result.new || [];
      this.processedSlugs.updated_slugs = result.updated || [];
      this.processedSlugs.skipped_slugs = result.skipped || [];
      this.processedSlugs.error_slugs = result.errors || [];
    }
  }


  /**
   * Get processed slugs for database queries (like Python file)
   */
  public getProcessedSlugs(): ProcessedSlugs {
    return this.processedSlugs;
  }

  /**
   * Main synchronization method
   */
  public async sync(): Promise<SyncResult> {
    try {
      // Call the RSS sync API
      const apiResponse = await this.callRSSSyncAPI();
      
      // Process the API response
      this.processAPIResponse(apiResponse);
      
      return {
        success: apiResponse.status === 'success',
        stats: this.stats,
        processed_slugs: this.processedSlugs,
        message: apiResponse.message || 'RSS sync completed via Cloud Function'
      };
    } catch (error) {
      return {
        success: false,
        stats: this.stats,
        processed_slugs: this.processedSlugs,
        message: `Sync failed: ${error}`
      };
    }
  }
}

/**
 * Main function to sync RSS feed with Firestore
 */
export async function syncRSSFeed(rssUrl: string = DEFAULT_RSS_URL): Promise<SyncResult> {
  const syncHandler = new RSSFirestoreSync(rssUrl);
  return await syncHandler.sync();
}