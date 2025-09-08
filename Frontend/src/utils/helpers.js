// Utility functions for the app

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
};

export const getFileIcon = (mimetype) => {
  if (!mimetype) return 'document';
  
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('zip') || mimetype.includes('rar')) return 'archive';
  if (mimetype.includes('word') || mimetype.includes('doc')) return 'document';
  if (mimetype.includes('excel') || mimetype.includes('sheet')) return 'spreadsheet';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
  
  return 'document';
};

export const isImageFile = (mimetype) => {
  return mimetype && mimetype.startsWith('image/');
};

export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  // Allow any file type for now, but could restrict if needed
  // if (!allowedTypes.includes(file.type)) {
  //   throw new Error('File type not supported');
  // }

  return true;
};

export const generateShareUrl = (id) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/view/${id}`;
};
