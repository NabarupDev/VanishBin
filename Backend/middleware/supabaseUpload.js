const multer = require('multer');
const { uploadFile, generateUniqueFileName, getPublicUrl } = require('../config/supabase');

// Configure multer to use memory storage (store files in memory instead of disk)
const storage = multer.memoryStorage();

// Define allowed MIME types for file uploads
const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'application/zip',
  // Add more as needed
];

// File filter to limit file types (security measure)
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Middleware to upload file to Supabase after multer processes it
const uploadToSupabase = async (req, res, next) => {
  if (!req.file) {
    return next(); // No file uploaded, continue
  }

  try {
    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(req.file.originalname);
    
    // Upload file to Supabase
    const { data, error } = await uploadFile(
      req.file.buffer,
      uniqueFileName,
      req.file.mimetype
    );

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload file to cloud storage'
      });
    }

    // Get public URL for the uploaded file
    const publicUrl = getPublicUrl(data.path);

    // Add Supabase data to request object
    req.supabaseFile = {
      path: data.path,
      publicUrl: publicUrl,
      uniqueFileName: uniqueFileName
    };

    next();
  } catch (error) {
    console.error('Upload to Supabase error:', error);
    res.status(500).json({
      error: 'Failed to upload file to cloud storage'
    });
  }
};

module.exports = {
  upload,
  uploadToSupabase
};
