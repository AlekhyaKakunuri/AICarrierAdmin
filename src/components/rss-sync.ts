import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  Firestore,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebase-configs';

// Browser-compatible hash function
const createHash = (algorithm: string) => {
  return {
    update: (data: string) => {
      // Simple hash implementation for browser
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return {
        digest: (encoding: string) => Math.abs(hash).toString(16)
      };
    }
  };
};

// Types
interface RSSData {
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  content_html: string | null;
  content_hash: string | null;
  author: string | null;
  published_at: Date | null;
  created_at: Date | null;
  language: string | null;
  generator: string | null;
  link: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  web_master: string | null;
}

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
  private db: Firestore | null = null;
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
   * Initialize Firestore connection
   */
  private async initializeFirestore(): Promise<boolean> {
    try {
      if (!this.db) {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        this.db = getFirestore(app);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch RSS feed content using CORS proxies (like Python file)
   */
  private async fetchRSSFeed(): Promise<string | null> {
    // Try multiple CORS proxies in order of reliability
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(this.rssUrl)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.ok) {
          const content = await response.text();
          // Validate that we got RSS content
          if (content.includes('<rss') || content.includes('<feed')) {
            return content;
          }
        }
      } catch (error) {
        // Continue to next proxy
        continue;
      }
    }

    return null;
  }


  /**
   * Parse RSS feed XML content and convert to structured data
   */
  private parseRSSFeed(rssContent: string): Document | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssContent, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('XML parsing error');
      }
      
      return xmlDoc;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert RSS XML to JSON format for easier processing
   */
  private convertRSSToJSON(xmlDoc: Document): any {
    const channel = xmlDoc.querySelector('channel');
    if (!channel) return null;

    const items = xmlDoc.querySelectorAll('item');
    const jsonItems = Array.from(items).map(item => {
      const getTextContent = (selector: string) => {
        const element = item.querySelector(selector);
        return element ? element.textContent?.trim() || null : null;
      };

      const getCDATAContent = (selector: string) => {
        const element = item.querySelector(selector);
        if (element) {
          // Get CDATA content
          const cdata = element.querySelector('![CDATA[');
          if (cdata) {
            return cdata.textContent?.trim() || null;
          }
          return element.textContent?.trim() || null;
        }
        return null;
      };

      return {
        title: getTextContent('title'),
        link: getTextContent('link'),
        description: getTextContent('description'),
        content: getCDATAContent('content\\:encoded') || getTextContent('description'),
        author: getTextContent('dc\\:creator') || getTextContent('creator'),
        pubDate: getTextContent('pubDate'),
        guid: getTextContent('guid'),
        // Extract enclosure for images
        enclosure: (() => {
          const enclosure = item.querySelector('enclosure');
          if (enclosure) {
            return {
              url: enclosure.getAttribute('url'),
              type: enclosure.getAttribute('type'),
              length: enclosure.getAttribute('length')
            };
          }
          return null;
        })()
      };
    });

    return {
      channel: {
        title: channel.querySelector('title')?.textContent?.trim() || '',
        description: channel.querySelector('description')?.textContent?.trim() || '',
        link: channel.querySelector('link')?.textContent?.trim() || '',
        language: channel.querySelector('language')?.textContent?.trim() || 'en',
        generator: channel.querySelector('generator')?.textContent?.trim() || '',
        lastBuildDate: channel.querySelector('lastBuildDate')?.textContent?.trim() || ''
      },
      items: jsonItems
    };
  }

  /**
   * Extract slug from RSS link URL
   */
  private extractSlugFromLink(link: string): string | null {
    try {
      if (link) {

        const slug = link.split('/').pop();
        return slug || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate content hash for change detection
   */
  private calculateContentHash(content: string): string | null {
    try {
      if (content) {
        const hash = createHash('md5');
        return hash.update(content).digest('hex');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract thumbnail URL from cover URL
   */
  private extractThumbnailUrl(coverUrl: string): string {
    try {
      if (coverUrl && coverUrl.includes('substackcdn.com')) {
        // Modify URL to get thumbnail version (300px width)
        const thumbnailUrl = coverUrl.replace(
          'f_auto,q_auto:good', 
          'w_300,c_limit,f_auto,q_auto:good'
        );
        return thumbnailUrl;
      }
      return coverUrl;
    } catch (error) {
      return coverUrl;
    }
  }

  /**
   * Extract all RSS fields for a single item
   */
  private extractRSSFields(item: Element, channel: Element | null): RSSData {
    const rssData: RSSData = {
      slug: null,
      title: null,
      excerpt: null,
      content_html: null,
      content_hash: null,
      author: null,
      published_at: null,
      created_at: null,
      language: null,
      generator: null,
      link: null,
      cover_url: null,
      thumbnail_url: null,
      web_master: null
    };
    
    // Extract basic fields
    const titleElem = item.querySelector('title');
    if (titleElem?.textContent) {
      rssData.title = titleElem.textContent.trim();
    }
    
    const linkElem = item.querySelector('link');
    if (linkElem?.textContent) {
      rssData.link = linkElem.textContent.trim();
      rssData.slug = this.extractSlugFromLink(rssData.link);
    }
    
    const descriptionElem = item.querySelector('description');
    if (descriptionElem?.textContent) {
      rssData.excerpt = descriptionElem.textContent.trim();
    }
    
    // Extract content:encoded
    const contentEncoded = item.querySelector('content\\:encoded, encoded');
    if (contentEncoded?.textContent) {
      rssData.content_html = contentEncoded.textContent.trim();
      rssData.content_hash = this.calculateContentHash(rssData.content_html);
    }
    
    // Extract author
    const authorElem = item.querySelector('dc\\:creator, creator');
    if (authorElem?.textContent) {
      rssData.author = authorElem.textContent.trim();
    }
    
    // Extract publication date
    const pubDateElem = item.querySelector('pubDate');
    if (pubDateElem?.textContent) {
      try {
        const pubDateStr = pubDateElem.textContent.trim();
        const pubDate = new Date(pubDateStr);
        rssData.published_at = pubDate;
        rssData.created_at = pubDate; // Same as published_at
      } catch (error) {
        // Silent error handling
      }
    }
    
    // Extract enclosure for cover image
    const enclosureElem = item.querySelector('enclosure');
    if (enclosureElem) {
      const coverUrl = enclosureElem.getAttribute('url');
      if (coverUrl) {
        rssData.cover_url = coverUrl;
        rssData.thumbnail_url = this.extractThumbnailUrl(coverUrl);
      }
    }
    
    // Extract channel-level fields
    if (channel) {
      // Language
      const languageElem = channel.querySelector('language');
      if (languageElem?.textContent) {
        rssData.language = languageElem.textContent.trim();
      }
      
      // Generator
      const generatorElem = channel.querySelector('generator');
      if (generatorElem?.textContent) {
        rssData.generator = generatorElem.textContent.trim();
      }
      
      // Web master
      const webMasterElem = channel.querySelector('webMaster');
      if (webMasterElem?.textContent) {
        rssData.web_master = webMasterElem.textContent.trim();
      }
    }
    
    return rssData;
  }

  /**
   * Check if slug exists in Firestore (READ ONLY)
   */
  private async checkSlugExists(slug: string): Promise<{ exists: boolean; doc: QueryDocumentSnapshot<DocumentData> | null }> {
    try {
      if (!slug || !this.db) {
        return { exists: false, doc: null };
      }
      
      const q = query(collection(this.db, 'blogs'), where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { exists: true, doc: querySnapshot.docs[0] };
      } else {
        return { exists: false, doc: null };
      }
    } catch (error) {
      return { exists: false, doc: null };
    }
  }

  /**
   * Check if content has changed (READ ONLY)
   */
  private async checkContentChanged(rssData: RSSData): Promise<boolean> {
    try {
      if (!rssData.slug || !this.db) {
        return false;
      }
      
      const q = query(collection(this.db, 'blogs'), where('slug', '==', rssData.slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        
        // Compare content hash
        if (existingData.content_hash !== rssData.content_hash) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }


  /**
   * Process all RSS items and categorize slugs (NO DATABASE WRITING)
   */
  private async processRSSItems(xmlDoc: Document): Promise<SyncStats> {
    // Get channel for global fields
    const channel = xmlDoc.querySelector('channel');
    
    // Get all items
    const items = xmlDoc.querySelectorAll('item');
    
    this.stats.total_items = items.length;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        // Extract RSS fields
        const rssData = this.extractRSSFields(item, channel);
        
        if (!rssData.slug) {
          this.stats.errors++;
          this.processedSlugs.error_slugs.push(`item-${i + 1}`);
          continue;
        }
        
        // Check if slug exists in database (READ ONLY)
        const { exists } = await this.checkSlugExists(rssData.slug);
        
        if (!exists) {
          // New slug - would be added to database
          this.stats.new_items++;
          this.processedSlugs.new_slugs.push(rssData.slug);
        } else {
          // Existing slug - check if content changed
          const contentChanged = await this.checkContentChanged(rssData);
          
          if (contentChanged) {
            // Would be updated in database
            this.stats.updated_items++;
            this.processedSlugs.updated_slugs.push(rssData.slug);
          } else {
            // No changes - would be skipped
            this.stats.skipped_items++;
            this.processedSlugs.skipped_slugs.push(rssData.slug);
          }
        }
      } catch (error) {
        this.stats.errors++;
        // Try to get slug for error tracking
        try {
          const rssData = this.extractRSSFields(item, channel);
          if (rssData.slug) {
            this.processedSlugs.error_slugs.push(rssData.slug);
          }
        } catch {
          this.processedSlugs.error_slugs.push(`item-${i + 1}`);
        }
      }
    }
    
    return this.stats;
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
      // Initialize Firestore
      if (!(await this.initializeFirestore())) {
        return {
          success: false,
          stats: this.stats,
          processed_slugs: this.processedSlugs,
          message: 'Failed to initialize Firestore'
        };
      }
      
      // Fetch RSS feed
      const rssContent = await this.fetchRSSFeed();
      if (!rssContent) {
        return {
          success: false,
          stats: this.stats,
          processed_slugs: this.processedSlugs,
          message: 'Failed to fetch RSS feed'
        };
      }
      
      // Parse RSS feed
      const xmlDoc = this.parseRSSFeed(rssContent);
      if (!xmlDoc) {
        return {
          success: false,
          stats: this.stats,
          processed_slugs: this.processedSlugs,
          message: 'Failed to parse RSS feed'
        };
      }
      
      // Convert to JSON for easier processing
      const rssJSON = this.convertRSSToJSON(xmlDoc);
      if (!rssJSON) {
        return {
          success: false,
          stats: this.stats,
          processed_slugs: this.processedSlugs,
          message: 'Failed to convert RSS to JSON'
        };
      }
      
      // Process RSS items
      const stats = await this.processRSSItems(xmlDoc);
      
      return {
        success: true,
        stats: stats,
        processed_slugs: this.processedSlugs,
        message: 'RSS analysis completed - no data written to database'
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