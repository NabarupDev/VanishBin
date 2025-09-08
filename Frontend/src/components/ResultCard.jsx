import { useState } from 'preact/hooks';

const ResultCard = ({ result, onBack }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = result.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Successful!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your {result.type === 'file' ? 'file' : 'text'} "{result.data?.title || 'content'}" has been shared successfully. 
          Share the link below with anyone you want to give access to.
        </p>

        {/* Shareable Link */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shareable Link
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={result.url}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Important Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• This link will expire in 3 hours</li>
                <li>• Files are automatically deleted after expiration</li>
                <li>• Anyone with this link can access your content</li>
                <li>• Maximum file size: 50MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            Share Another
          </button>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-center cursor-pointer"
          >
            View Content
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
