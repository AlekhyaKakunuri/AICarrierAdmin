import React, { useState } from 'react';
import { syncRSSFeed, DEFAULT_RSS_URL, SyncResult } from './rss-sync';

interface RSSSyncButtonProps {
  rssUrl?: string;
  onSyncComplete?: (result: SyncResult) => void;
  className?: string;
  disabled?: boolean;
}

export const RSSSyncButton: React.FC<RSSSyncButtonProps> = ({
  rssUrl = DEFAULT_RSS_URL,
  onSyncComplete,
  className = '',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const handleSyncClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setLastSyncResult(null);

    try {
      const result = await syncRSSFeed(rssUrl);
      
      setLastSyncResult(result);
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      setLastSyncResult({
        success: false,
        stats: {
          total_items: 0,
          new_items: 0,
          updated_items: 0,
          skipped_items: 0,
          errors: 1
        },
        processed_slugs: {
          new_slugs: [],
          updated_slugs: [],
          skipped_slugs: [],
          error_slugs: []
        },
        message: `Sync error: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Analyzing...';
    if (lastSyncResult?.success) return 'Analyze Again';
    return 'Sync RSS Feed';
  };

  const getButtonClass = () => {
    let baseClass = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 ';
    
    if (disabled || isLoading) {
      baseClass += 'bg-gray-300 text-gray-500 cursor-not-allowed';
    } else if (lastSyncResult?.success) {
      baseClass += 'bg-green-600 hover:bg-green-700 text-white';
    } else if (lastSyncResult && !lastSyncResult.success) {
      baseClass += 'bg-red-600 hover:bg-red-700 text-white';
    } else {
      baseClass += 'bg-blue-600 hover:bg-blue-700 text-white';
    }
    
    return baseClass + ' ' + className;
  };

  return (
    <div className="rss-sync-container">
      <button
        onClick={handleSyncClick}
        disabled={disabled || isLoading}
        className={getButtonClass()}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {getButtonText()}
      </button>

      {lastSyncResult && (
        <div className={`mt-4 p-4 rounded-md ${
          lastSyncResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {lastSyncResult.success ? (
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <h3 className={`text-sm font-medium ${
              lastSyncResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {lastSyncResult.success ? 'RSS Analysis Completed!' : 'Analysis Failed'}
            </h3>
          </div>
          
          <div className="mt-2">
            <p className={`text-sm ${
              lastSyncResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {lastSyncResult.message}
            </p>
            
            {lastSyncResult.success && (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium">Total Items:</span> {lastSyncResult.stats.total_items}
                  </div>
                  <div>
                    <span className="font-medium">New Items:</span> {lastSyncResult.stats.new_items}
                  </div>
                  <div>
                    <span className="font-medium">Updated Items:</span> {lastSyncResult.stats.updated_items}
                  </div>
                  <div>
                    <span className="font-medium">Skipped Items:</span> {lastSyncResult.stats.skipped_items}
                  </div>
                  {lastSyncResult.stats.errors > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium text-red-600">Errors:</span> {lastSyncResult.stats.errors}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-100 p-3 rounded text-xs">
                  <h4 className="font-medium mb-2">Processed Slugs (for Database Queries):</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium text-green-600">New slugs ({lastSyncResult.processed_slugs.new_slugs.length}):</span>
                      <div className="ml-2 text-xs text-gray-600">
                        {lastSyncResult.processed_slugs.new_slugs.length > 0 
                          ? lastSyncResult.processed_slugs.new_slugs.join(', ')
                          : 'None'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Updated slugs ({lastSyncResult.processed_slugs.updated_slugs.length}):</span>
                      <div className="ml-2 text-xs text-gray-600">
                        {lastSyncResult.processed_slugs.updated_slugs.length > 0 
                          ? lastSyncResult.processed_slugs.updated_slugs.join(', ')
                          : 'None'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-600">Skipped slugs ({lastSyncResult.processed_slugs.skipped_slugs.length}):</span>
                      <div className="ml-2 text-xs text-gray-600">
                        {lastSyncResult.processed_slugs.skipped_slugs.length > 0 
                          ? lastSyncResult.processed_slugs.skipped_slugs.join(', ')
                          : 'None'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Error slugs ({lastSyncResult.processed_slugs.error_slugs.length}):</span>
                      <div className="ml-2 text-xs text-gray-600">
                        {lastSyncResult.processed_slugs.error_slugs.length > 0 
                          ? lastSyncResult.processed_slugs.error_slugs.join(', ')
                          : 'None'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RSSSyncButton;