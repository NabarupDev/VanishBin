const express = require('express');
const router = express.Router();
const { upload, uploadToSupabase } = require('../middleware/supabaseUpload');
const { uploadContent, getContent, serveFile, getAllShares } = require('../controllers/shareController');
const { cleanupExpiredShares, getCleanupStats } = require('../services/cleanupService');

// GET /all - Get all shares (must be before /:id route)
router.get('/all', getAllShares);

// GET /cleanup/stats - Get cleanup statistics
router.get('/cleanup/stats', async (req, res) => {
  try {
    const stats = await getCleanupStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Cleanup stats error:', error);
    res.status(500).json({
      error: 'Failed to get cleanup statistics'
    });
  }
});

// POST /cleanup - Manually trigger cleanup
router.post('/cleanup', async (req, res) => {
  try {
    const result = await cleanupExpiredShares();
    res.json(result);
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run cleanup process'
    });
  }
});

// POST /upload - Upload text or file
router.post('/upload', upload.single('file'), uploadToSupabase, uploadContent);

// GET /:id - Get shared content (text and/or file info)
router.get('/:id', getContent);

// GET /file/:id - Serve file directly for download
router.get('/file/:id', serveFile);

module.exports = router;
