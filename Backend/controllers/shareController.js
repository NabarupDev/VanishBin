const Share = require('../models/Share');
const path = require('path');
const fs = require('fs');
const { deleteFile } = require('../config/supabase');

// POST /upload - Handle text or file upload
const uploadContent = async (req, res) => {
  try {
    const { text, title } = req.body;
    const file = req.file;
    const supabaseFile = req.supabaseFile;

    // Validate that either text or file is provided
    if (!text && !file) {
      return res.status(400).json({ 
        error: 'Either text content or file must be provided' 
      });
    }

    // Validate that title is provided
    if (!title || !title.trim()) {
      return res.status(400).json({ 
        error: 'Title is required' 
      });
    }

    // Create new share document
    const shareData = {
      title: title.trim()
    };

    if (text) {
      shareData.content = text;
    }

    if (file && supabaseFile) {
      shareData.fileUrl = supabaseFile.publicUrl;
      shareData.supabaseFilePath = supabaseFile.path;
      shareData.originalFileName = file.originalname;
      shareData.fileSize = file.size;
      shareData.mimeType = file.mimetype;
    }

    const newShare = new Share(shareData);
    const savedShare = await newShare.save();

    // Return response with share ID and link
    res.status(201).json({
      success: true,
      id: savedShare._id,
      shareLink: `/view/${savedShare._id}`,
      expiresAt: new Date(savedShare.createdAt.getTime() + 10800000), // 3 hours from creation
      data: {
        title: savedShare.title,
        hasText: !!savedShare.content,
        hasFile: !!savedShare.fileUrl,
        originalFileName: savedShare.originalFileName,
        fileSize: savedShare.fileSize,
        mimeType: savedShare.mimeType
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // If there was an error after uploading to Supabase, clean up the uploaded file
    if (req.supabaseFile) {
      try {
        await deleteFile(req.supabaseFile.path);
        console.log('Cleaned up uploaded file due to error:', req.supabaseFile.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Internal server error during upload' 
    });
  }
};

// GET /:id - Retrieve shared content
const getContent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the share by ID
    const share = await Share.findById(id);

    if (!share) {
      return res.status(404).json({ 
        error: 'Content not found or has expired' 
      });
    }

    // Check if content has expired (additional check, though TTL should handle this)
    const now = new Date();
    const expiryTime = new Date(share.createdAt.getTime() + 10800000); // 3 hours
    
    if (now > expiryTime) {
      return res.status(410).json({ 
        error: 'Content has expired' 
      });
    }

    // Return the content
    const responseData = {
      success: true,
      id: share._id,
      title: share.title,
      createdAt: share.createdAt,
      expiresAt: expiryTime
    };

    if (share.content) {
      responseData.text = share.content;
    }

    if (share.fileUrl) {
      responseData.file = {
        url: share.fileUrl,
        originalName: share.originalFileName,
        size: share.fileSize,
        mimeType: share.mimeType
      };
    }

    res.json(responseData);

  } catch (error) {
    console.error('Get content error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid content ID' 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

// GET /file/:id - Serve file directly
const serveFile = async (req, res) => {
  try {
    const { id } = req.params;

    const share = await Share.findById(id);

    if (!share || !share.fileUrl) {
      return res.status(404).json({ 
        error: 'File not found or has expired' 
      });
    }

    // Check if content has expired
    const now = new Date();
    const expiryTime = new Date(share.createdAt.getTime() + 10800000);
    
    if (now > expiryTime) {
      return res.status(410).json({ 
        error: 'File has expired' 
      });
    }

    // For Supabase files, redirect to the public URL
    // The file is already publicly accessible via Supabase
    if (share.fileUrl.includes('supabase')) {
      return res.redirect(share.fileUrl);
    }

    // Fallback for legacy local files (if any exist)
    const filePath = path.join(__dirname, '..', share.fileUrl);

    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found on server' 
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${share.originalFileName}"`);
    res.setHeader('Content-Type', share.mimeType || 'application/octet-stream');

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Serve file error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid file ID' 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

// GET /all - Get all shares (for admin/listing purposes)
const getAllShares = async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all non-expired shares, sorted by creation date (newest first)
    const shares = await Share.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title content fileUrl originalFileName fileSize mimeType createdAt');

    // Filter out expired shares and format response
    const now = new Date();
    const validShares = shares.filter(share => {
      const expiryTime = new Date(share.createdAt.getTime() + 10800000); // 3 hours
      return now <= expiryTime;
    }).map(share => {
      const expiryTime = new Date(share.createdAt.getTime() + 10800000);
      return {
        id: share._id,
        title: share.title,
        hasText: !!share.content,
        hasFile: !!share.fileUrl,
        originalFileName: share.originalFileName,
        fileSize: share.fileSize,
        mimeType: share.mimeType,
        createdAt: share.createdAt,
        expiresAt: expiryTime,
        // Add preview of text content (first 100 characters)
        textPreview: share.content ? share.content.substring(0, 100) + (share.content.length > 100 ? '...' : '') : null
      };
    });

    // Get total count for pagination
    const totalShares = await Share.countDocuments({});
    
    res.json({
      success: true,
      shares: validShares,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalShares / limit),
        totalShares,
        hasNext: page * limit < totalShares,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all shares error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

module.exports = {
  uploadContent,
  getContent,
  serveFile,
  getAllShares
};
