import { useState } from 'preact/hooks';
import { validateFile, generateShareUrl } from '../utils/helpers';
import { API_ENDPOINTS } from '../config/api';

const UploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !file) {
      setError('Please enter text or select a file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for your share');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate file if present
      if (file) {
        validateFile(file);
      }

      const formData = new FormData();
      
      formData.append('title', title.trim());
      
      if (password.trim()) {
        formData.append('password', password.trim());
      }
      
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      const response = await fetch(API_ENDPOINTS.upload, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Generate the full URL for sharing
      const shareUrl = generateShareUrl(data.id);
      const result = {
        ...data,
        url: shareUrl,
        type: file ? 'file' : 'text'
      };
      
      onUploadSuccess(result);
      
      // Reset form
      setTitle('');
      setText('');
      setFile(null);
      setPassword('');
      if (e.target.file) e.target.file.value = '';
      
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      try {
        validateFile(selectedFile);
        setFile(selectedFile);
        setText(''); // Clear text when file is selected
        setError(''); // Clear any previous errors
      } catch (err) {
        setError(err.message);
        e.target.value = ''; // Clear the file input
      }
    }
  };

  const truncateFileName = (fileName, maxLength = 30) => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
    
    return `${truncatedName}...${extension}`;
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      setFile(null); // Clear file when text is entered
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (loading || text.trim()) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      try {
        validateFile(droppedFile);
        setFile(droppedFile);
        setText(''); // Clear text when file is dropped
        setError(''); // Clear any previous errors
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Share Text or Files
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your share..."
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password Protection <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to protect this share..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {password ? 'This share will be password protected' : 'Leave empty for public access'}
          </p>
        </div>

        {/* Text Input */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Share Text
          </label>
          <textarea
            id="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text here..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={loading || file}
          />
        </div>

        {/* OR Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-4 text-sm text-gray-500">OR</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* File Input */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <div 
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : file 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={loading || text.trim()}
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {dragActive 
                  ? "Drop your file here..." 
                  : "Images, PDFs, Documents up to 50MB"
                }
              </p>
              {file && (
                <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm text-green-700 font-medium break-all" title={file.name}>
                    📎 {truncateFileName(file.name)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (!text.trim() && !file) || !title.trim()}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          ) : (
            'Share'
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
