const mongoose = require('mongoose');
const { deleteFile } = require('../config/supabase');

const shareSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  supabaseFilePath: {
    type: String,
    default: null
  },
  originalFileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: null
  },
  mimeType: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 10800000); // 3 hours from now
    }
  }
});

// Remove TTL index from createdAt and don't use MongoDB's automatic TTL
// Instead, we'll handle expiration manually in our cleanup service
shareSchema.index({ expiresAt: 1 });

// Pre-remove hook to delete file from Supabase when document is removed
shareSchema.pre('deleteOne', { document: true, query: false }, async function() {
  if (this.supabaseFilePath) {
    try {
      const { error } = await deleteFile(this.supabaseFilePath);
      if (error) {
        console.error(`Failed to delete file from Supabase: ${this.supabaseFilePath}`, error);
      } else {
        console.log(`Successfully deleted file from Supabase: ${this.supabaseFilePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file from Supabase: ${this.supabaseFilePath}`, error);
    }
  }
});

// Pre-findOneAndDelete hook to delete file from Supabase
shareSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.supabaseFilePath) {
    try {
      const { error } = await deleteFile(doc.supabaseFilePath);
      if (error) {
        console.error(`Failed to delete file from Supabase: ${doc.supabaseFilePath}`, error);
      } else {
        console.log(`Successfully deleted file from Supabase: ${doc.supabaseFilePath}`);
      }
    } catch (error) {
      console.error(`Error deleting file from Supabase: ${doc.supabaseFilePath}`, error);
    }
  }
});

module.exports = mongoose.model('Share', shareSchema);
