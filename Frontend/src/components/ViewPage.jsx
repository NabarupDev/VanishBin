import { useState, useEffect } from 'preact/hooks';
import { API_ENDPOINTS } from '../config/api';
import { passwordCache } from '../utils/passwordCache';

const ViewPage = ({ id }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // Check if we have a cached password first
    const cachedPassword = passwordCache.get(id);
    if (cachedPassword) {
      fetchContent(cachedPassword);
    } else {
      fetchContent();
    }
  }, [id]);

  // Update time remaining every minute
  useEffect(() => {
    if (!content?.expiresAt) return;

    const updateTimeRemaining = () => {
      const remaining = getTimeRemaining(content.expiresAt);
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimeRemaining();

    // Update every minute
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [content?.expiresAt]);

  const fetchContent = async (passwordAttempt = '') => {
    try {
      setLoading(true);
      setError('');
      setPasswordError('');

      let url = API_ENDPOINTS.getContent(id);
      if (passwordAttempt) {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.append('password', passwordAttempt);
        url = urlObj.toString();
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setLoading(false);
          setError('Content not found or has expired');
          return;
        }
        if (response.status === 401) {
          const data = await response.json();
          if (data.passwordRequired) {
            // Remove invalid cached password if it exists
            if (passwordAttempt) {
              passwordCache.remove(id);
            }
            setPasswordRequired(true);
            setLoading(false);
            if (passwordAttempt) {
              setPasswordError('Invalid password. Please try again.');
            }
            return;
          }
        }
        setLoading(false);
        setError('Failed to load content');
        return;
      }

      const data = await response.json();
      
      // If we successfully loaded content with a password, cache it
      if (passwordAttempt && data.passwordProtected) {
        passwordCache.store(id, passwordAttempt);
      }
      
      setContent(data);
      setPasswordRequired(false);
      setLoading(false);

    } catch (err) {
      console.error('Fetch error:', err);
      setLoading(false);
      setError(err.message || 'Failed to load content');
    }
  };

  const downloadFile = async () => {
    if (content && content.file) {
      try {
        setDownloading(true);
        setDownloadStatus('Preparing download...');
        console.log('Downloading file:', content.file);
        
        // Always use fetch to download the file content, then create a blob
        // This ensures the file is actually downloaded to the device
        const downloadUrl = content.file.url.includes('supabase') 
          ? content.file.url 
          : API_ENDPOINTS.downloadFile(id);
          
        console.log('Fetching file from:', downloadUrl);
        setDownloadStatus('Downloading file...');
        
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        setDownloadStatus('Processing file...');
        
        // Get the file as a blob
        const blob = await response.blob();
        console.log('File blob received:', blob.size, 'bytes');
        
        setDownloadStatus('Starting download...');
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = truncateFileName(content.file.originalName, 100) || 'download';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
        
        setDownloadStatus('Download completed!');
        console.log('Download initiated successfully');
        
        // Clear status after 2 seconds
        setTimeout(() => {
          setDownloadStatus('');
        }, 2000);
        
      } catch (err) {
        console.error('Download failed:', err);
        setDownloadStatus('Download failed, trying alternative...');
        
        // Fallback: try to open in new tab with download suggestion
        if (content.file.url) {
          console.log('Fallback: opening in new tab');
          // Create a temporary link with download attribute
          const link = document.createElement('a');
          link.href = content.file.url;
          link.download = truncateFileName(content.file.originalName, 100) || 'download';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setDownloadStatus('Opened in new tab');
          setTimeout(() => {
            setDownloadStatus('');
          }, 2000);
        } else {
          setDownloadStatus('Download failed');
          setTimeout(() => {
            setDownloadStatus('');
            alert('Failed to download file. Please try the "Copy URL" button and open the link in a new tab.');
          }, 1000);
        }
      } finally {
        setDownloading(false);
      }
    }
  };

  const copyFileUrl = async () => {
    if (content && content.file && content.file.url) {
      try {
        await navigator.clipboard.writeText(content.file.url);
        // You could add a toast notification here
        console.log('File URL copied to clipboard');
      } catch (err) {
        console.error('Failed to copy URL:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content.file.url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  const isImageFile = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const isVideoFile = (mimeType) => {
    return mimeType && mimeType.startsWith('video/');
  };

  const isAudioFile = (mimeType) => {
    return mimeType && mimeType.startsWith('audio/');
  };

  const isPdfFile = (mimeType) => {
    return mimeType && mimeType === 'application/pdf';
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password.trim()) {
      setPasswordError('');
      await fetchContent(password.trim());
    }
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const truncateFileName = (fileName, maxLength = 40) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    
    if (nameWithoutExt.length <= maxLength - extension.length - 4) {
      return fileName;
    }
    
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
    return `${truncatedName}...${extension}`;
  };

  const copyToClipboard = async () => {
    if (content && content.text) {
      try {
        await navigator.clipboard.writeText(content.text);
        // You could add a toast notification here
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content.text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center">
            <svg className="animate-spin mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Loading content...</h2>
            <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch your shared content.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 mb-3 sm:mb-4">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Content Not Found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={fetchContent}
                className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-transparent rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <a
                href="/"
                className="w-full inline-block px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-center cursor-pointer"
              >
                Create New Share
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password prompt screen
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-100 mb-3 sm:mb-4">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Password Protected</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">This content is password protected. Please enter the password to view it.</p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-md text-xs sm:text-sm">
                  {passwordError}
                </div>
              )}
              
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !password.trim()}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-transparent rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Submit'}
                </button>
                <a
                  href="/"
                  className="w-full inline-block px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-center cursor-pointer"
                >
                  Create New Share
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {content.title || 'Shared Content'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            This content was shared with you via VanishBin
          </p>
        </div>

        {/* Content Display */}
        <div className="space-y-6 sm:space-y-8">
          {content.text && (
            /* Text Content */
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Text Content
                </h2>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy Text</span>
                  <span className="sm:hidden">Copy</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-6">
                <pre className="whitespace-pre-wrap text-gray-800 font-mono text-xs sm:text-sm leading-relaxed">
                  {content.text}
                </pre>
              </div>
            </div>
          )}

          {content.file && (
            /* File Content */
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  {truncateFileName(content.file?.originalName) || 'Shared File'}
                </h2>
                
                {/* Show full filename in a tooltip or smaller text if truncated */}
                {content.file?.originalName && content.file.originalName.length > 40 && (
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4" title={content.file.originalName}>
                    Full name: {content.file.originalName}
                  </p>
                )}
                
                {/* File Preview Section */}
                <div className="mb-6 sm:mb-8">
                  {isImageFile(content.file.mimeType) && (
                    <div className="mb-4 sm:mb-6">
                      <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-2 sm:p-4">
                        <img
                          src={content.file.url}
                          alt={truncateFileName(content.file.originalName)}
                          className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                          style={{ maxHeight: '400px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'block';
                          }}
                        />
                        <div className="text-center text-gray-500 text-xs sm:text-sm mt-2 hidden">
                          Failed to load image preview
                        </div>
                      </div>
                    </div>
                  )}

                  {isVideoFile(content.file.mimeType) && (
                    <div className="mb-4 sm:mb-6">
                      <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-2 sm:p-4">
                        <video
                          controls
                          className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                          style={{ maxHeight: '300px' }}
                        >
                          <source src={content.file.url} type={content.file.mimeType} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}

                  {isAudioFile(content.file.mimeType) && (
                    <div className="mb-4 sm:mb-6">
                      <div className="max-w-xl mx-auto bg-gray-50 rounded-lg p-2 sm:p-4">
                        <audio
                          controls
                          className="w-full"
                        >
                          <source src={content.file.url} type={content.file.mimeType} />
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    </div>
                  )}

                  {isPdfFile(content.file.mimeType) && (
                    <div className="mb-4 sm:mb-6">
                      <div className="max-w-4xl mx-auto bg-gray-50 rounded-lg p-2 sm:p-4">
                        <iframe
                          src={content.file.url}
                          className="w-full rounded-lg shadow-md"
                          style={{ height: '400px' }}
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  )}

                  {!isImageFile(content.file.mimeType) && 
                   !isVideoFile(content.file.mimeType) && 
                   !isAudioFile(content.file.mimeType) && 
                   !isPdfFile(content.file.mimeType) && (
                    <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-blue-100 mb-4 sm:mb-6">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* File Information */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-6 mb-4 sm:mb-6">
                  <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                    {content.file?.size && (
                      <div>
                        Size: {(content.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                    {content.file?.mimeType && (
                      <div>
                        Type: {content.file.mimeType}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                  <button
                    onClick={downloadFile}
                    disabled={downloading}
                    className={`inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent rounded-md text-sm sm:text-base font-medium text-white transition-colors ${
                      downloading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer'
                    }`}
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Downloading...</span>
                        <span className="sm:hidden">Downloading</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">Download File</span>
                        <span className="sm:hidden">Download</span>
                      </>
                    )}
                  </button>

                  {(isImageFile(content.file?.mimeType) || 
                    isVideoFile(content.file?.mimeType) || 
                    isAudioFile(content.file?.mimeType) || 
                    isPdfFile(content.file?.mimeType)) && (
                    <button
                      onClick={() => window.open(content.file.url, '_blank')}
                      className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 rounded-md text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                    >
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="hidden sm:inline">Open in New Tab</span>
                      <span className="sm:hidden">Open</span>
                    </button>
                  )}

                  <button
                    onClick={copyFileUrl}
                    className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Copy URL</span>
                    <span className="sm:hidden">Copy</span>
                  </button>
                </div>

                {/* Download Status */}
                {downloadStatus && (
                  <div className="mt-3 sm:mt-4 text-center">
                    <p className={`text-xs sm:text-sm ${
                      downloadStatus.includes('failed') || downloadStatus.includes('Failed') 
                        ? 'text-red-600' 
                        : downloadStatus.includes('completed') 
                        ? 'text-green-600' 
                        : 'text-blue-600'
                    }`}>
                      {downloadStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp and Expiry */}
          {content.createdAt && (
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-xs sm:text-sm text-gray-500">
                Shared on {new Date(content.createdAt).toLocaleString()}
              </div>
              {timeRemaining && (
                <div className={`text-xs sm:text-sm font-medium ${
                  timeRemaining === 'Expired' 
                    ? 'text-red-600' 
                    : timeRemaining.includes('m remaining') && !timeRemaining.includes('h') && !timeRemaining.includes('d')
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {timeRemaining === 'Expired' ? '⚠️ Content Expired' : `⏰ ${timeRemaining}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Warning Message */}
        <div className="mt-6 sm:mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-xs sm:text-sm text-yellow-800">
                <strong>Note:</strong> This content will automatically expire and be deleted for security. 
                Make sure to save it if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 sm:mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Create Your Own Share</span>
            <span className="sm:hidden">Create Share</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ViewPage;