const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for storage operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable. Please set it in your .env file');
}

// Use service role key for storage operations to bypass RLS
// Fall back to anon key if service key is not available
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  throw new Error('Missing Supabase keys. Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your .env file');
}

// Create client with service role key for storage operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Storage bucket name for file uploads
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

/**
 * Upload a file to Supabase storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The name for the file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<{data: object, error: object}>}
 */
const uploadFile = async (fileBuffer, fileName, mimeType) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a file from Supabase storage
 * @param {string} filePath - The path of the file to delete
 * @returns {Promise<{data: object, error: object}>}
 */
const deleteFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get a public URL for a file
 * @param {string} filePath - The path of the file
 * @returns {string} The public URL
 */
const getPublicUrl = (filePath) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Generate a unique file name with timestamp and random string
 * @param {string} originalName - The original file name
 * @returns {string} A unique file name
 */
const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.round(Math.random() * 1E9);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
  
  return `${timestamp}-${randomString}-${nameWithoutExt}.${extension}`;
};

module.exports = {
  supabase,
  uploadFile,
  deleteFile,
  getPublicUrl,
  generateUniqueFileName,
  STORAGE_BUCKET
};
