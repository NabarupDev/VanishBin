import { useState, useEffect } from 'preact/hooks';
import { API_ENDPOINTS } from '../config/api';
import { passwordCache } from '../utils/passwordCache';

const AllContentPage = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filteredShares, setFilteredShares] = useState([]);
  const [totalShares, setTotalShares] = useState(0);
  const [cacheRefresh, setCacheRefresh] = useState(0); // To trigger re-renders when cache changes

  const ITEMS_PER_PAGE = 12; // Reduced for better UX

  useEffect(() => {
    fetchInitialShares();
  }, []);

  // Listen for cache changes to update UI
  useEffect(() => {
    const handleStorageChange = () => {
      setCacheRefresh(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check cache periodically for expiry updates
    const interval = setInterval(() => {
      setCacheRefresh(prev => prev + 1);
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Debounce search query to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Scroll event listener for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (searchQuery) return; // Don't load more during search
      
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when user scrolls to 80% of the page
      if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMore && !loadingMore && !loading) {
        loadMoreShares();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loading, searchQuery]);

  // Filter shares based on search query (immediate response)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredShares(shares);
    } else {
      const filtered = shares.filter(share => 
        share.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (share.originalFileName && share.originalFileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (share.textPreview && share.textPreview.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredShares(filtered);
    }
  }, [shares, searchQuery]);

  const fetchInitialShares = async () => {
    try {
      setLoading(true);
      setError('');
      setCurrentPage(1);

      const response = await fetch(`${API_ENDPOINTS.getAllShares}?page=1&limit=${ITEMS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error('Failed to load content');
      }

      const data = await response.json();
      setShares(data.shares || []);
      setTotalShares(data.pagination?.totalShares || 0);
      setHasMore(data.shares?.length === ITEMS_PER_PAGE);
      setCurrentPage(2); // Next page to load
    } catch (err) {
      setError(err.message || 'Failed to load content');
      setShares([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreShares = async () => {
    try {
      setLoadingMore(true);

      const response = await fetch(`${API_ENDPOINTS.getAllShares}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      
      if (!response.ok) {
        throw new Error('Failed to load more content');
      }

      const data = await response.json();
      const newShares = data.shares || [];
      
      if (newShares.length > 0) {
        setShares(prevShares => [...prevShares, ...newShares]);
        setCurrentPage(prev => prev + 1);
        setHasMore(newShares.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more shares:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setShares([]);
    setSearchQuery('');
    setHasMore(true);
    setCurrentPage(1);
    fetchInitialShares();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery.trim() || !text) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <svg className="animate-spin mx-auto h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading content...</h2>
            <p className="text-gray-600">Please wait while we fetch all shared content.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Content</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Shared Content</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Browse all uploaded files and text content • Total: {totalShares} items
                {searchQuery && ` • Showing ${filteredShares.length} results`}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by title, filename, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-4 text-xs sm:text-sm text-gray-600">
              {debouncedSearchQuery === searchQuery ? (
                filteredShares.length > 0 ? (
                  `Found ${filteredShares.length} result${filteredShares.length !== 1 ? 's' : ''} for "${searchQuery}"`
                ) : (
                  `No results found for "${searchQuery}"`
                )
              ) : (
                <div className="flex items-center">
                  <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Grid */}
        {filteredShares.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No Matching Content Found' : 'No Content Found'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {searchQuery 
                ? `No shared files or text content match your search for "${searchQuery}".`
                : 'There are no shared files or text content available at the moment.'
              }
            </p>
            {searchQuery ? (
              <button
                onClick={handleClearSearch}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                Create First Share
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredShares.map((share) => (
              <div key={share.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/view/${share.id}`}
                        className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer block truncate"
                        title={share.title}
                      >
                        {highlightText(share.title, searchQuery)}
                      </a>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {formatDate(share.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
                      {share.passwordProtected && (
                        <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                          passwordCache.has(share.id) 
                            ? 'bg-green-100' 
                            : 'bg-yellow-100'
                        }`} title={passwordCache.has(share.id) ? 'Password Cached' : 'Password Protected'}>
                          <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            passwordCache.has(share.id) 
                              ? 'text-green-600' 
                              : 'text-yellow-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {passwordCache.has(share.id) ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            )}
                          </svg>
                        </div>
                      )}
                      {share.hasText && (
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full" title="Contains text">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                      {share.hasFile && (
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full" title="Contains file">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="mb-3 sm:mb-4">
                    {share.textPreview && (
                      <div className={`bg-gray-50 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 relative overflow-hidden ${share.passwordProtected ? 'blur-[1px]' : ''}`}>
                        <p className="text-xs sm:text-sm text-gray-700 font-mono leading-relaxed break-words">
                          {highlightText(truncateText(share.textPreview), searchQuery)}
                        </p>
                        {share.passwordProtected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg">
                            <div className="bg-white px-2 py-1 sm:px-3 sm:py-1 rounded-md shadow-sm border border-yellow-200">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-xs font-medium text-yellow-700">Protected</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {share.hasFile && (
                      <div className={`bg-blue-50 rounded-lg p-2 sm:p-3 relative overflow-hidden ${share.passwordProtected ? 'blur-[1px]' : ''}`}>
                        <div className="flex items-center space-x-2 min-w-0">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium text-blue-900 truncate min-w-0 block" title={share.originalFileName}>
                            {highlightText(share.originalFileName, searchQuery)}
                          </span>
                        </div>
                        {share.fileSize && (
                          <p className="text-xs text-blue-600 mt-1">
                            {formatFileSize(share.fileSize)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {getTimeRemaining(share.expiresAt)}
                    </span>
                    <a
                      href={`/view/${share.id}`}
                      className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        share.passwordProtected 
                          ? passwordCache.has(share.id)
                            ? 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                            : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                          : 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      {share.passwordProtected ? (
                        passwordCache.has(share.id) ? (
                          <>
                            <svg className="mr-1 w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">View Content</span>
                            <span className="sm:hidden">View</span>
                          </>
                        ) : (
                          <>
                            <svg className="mr-1 w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="hidden sm:inline">Enter Password</span>
                            <span className="sm:hidden">🔐</span>
                          </>
                        )
                      ) : (
                        <>
                          <span className="hidden sm:inline">View Content</span>
                          <span className="sm:hidden">View</span>
                          <svg className="ml-1 w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button (fallback) and Loading Indicator */}
        {!searchQuery && filteredShares.length > 0 && (
          <div className="mt-8 text-center">
            {loadingMore && (
              <div className="mb-4">
                <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 mt-2">Loading more content...</p>
              </div>
            )}
            
            {hasMore && !loadingMore && (
              <button
                onClick={loadMoreShares}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Load More Content
              </button>
            )}
            
            {!hasMore && shares.length > 0 && (
              <p className="text-gray-500 text-sm">
                🎉 You've reached the end! No more content to load.
              </p>
            )}
          </div>
        )}

        {/* Search Results Footer */}
        {searchQuery && filteredShares.length > 0 && (
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">
              Showing all search results for "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllContentPage;
