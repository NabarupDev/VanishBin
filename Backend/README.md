# Temporary File/Text Sharing Backend

A Node.js + Express + MongoDB backend for temporary file and text sharing with automatic expiration, now powered by Supabase storage.

## Features

- 📝 **Text Sharing**: Share text content with unique links
- 📁 **File Sharing**: Upload and share files (up to 50MB) via Supabase Storage
- ⏰ **Auto Expiration**: Content automatically expires after 3 hours
- 🔗 **Unique Links**: Each share gets a unique ID and shareable link
- 🗄️ **MongoDB Storage**: Efficient storage with TTL indexes for metadata
- ☁️ **Supabase Storage**: Reliable cloud storage for files
- 🧹 **Auto Cleanup**: Automatic file deletion when content expires
- 🛡️ **Error Handling**: Comprehensive error handling and validation

## Prerequisites

1. **MongoDB**: Running instance (local or cloud)
2. **Supabase Account**: For file storage
   - Create a project at [supabase.com](https://supabase.com)
   - Create a storage bucket named "uploads" (or customize the name)
   - Make the bucket public for file access

## Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```bash
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/tempshare
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_STORAGE_BUCKET=uploads
   
   # Optional
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ENABLE_SCHEDULED_CLEANUP=true
   ```

3. **Setup Supabase Storage**:
   - Go to your Supabase dashboard
   - Navigate to Storage
   - Create a new bucket named "uploads"
   - Make it public (for file downloads)
   - Go to Settings → API and copy your **service_role** key to `.env`
   
   **Important**: Use the `service_role` key, not the `anon` key, to avoid Row Level Security issues.

4. **Start MongoDB**:
   Make sure MongoDB is running on your system.

5. **Run the Server**:
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Test the API**:
   ```bash
   curl http://localhost:5000/health
   ```

## API Endpoints

### 1. Upload Content
**POST** `/api/upload`

Upload either text content or a file (or both). Files are now stored in Supabase.

**Request Types:**

**A) Text Upload:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"title": "My Text Share", "text": "Hello, this is my shared text!"}'
```

**B) File Upload:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "title=My File Share" \
  -F "file=@/path/to/your/file.pdf"
```

**C) Both Text and File:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "title=Combined Share" \
  -F "text=Here is my document description" \
  -F "file=@/path/to/your/file.pdf"
```

**Response:**
```json
{
  "success": true,
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "shareLink": "/view/60f7b3b3b3b3b3b3b3b3b3b3",
  "expiresAt": "2024-01-01T15:00:00.000Z",
  "data": {
    "title": "My File Share",
    "hasText": true,
    "hasFile": true,
    "originalFileName": "document.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf"
  }
}
```

### 2. Retrieve Content
**GET** `/api/:id`

Get the shared content by ID.

```bash
curl http://localhost:5000/api/60f7b3b3b3b3b3b3b3b3b3b3
```

**Response:**
```json
{
  "success": true,
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "title": "My File Share",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "expiresAt": "2024-01-01T15:00:00.000Z",
  "text": "Hello, this is my shared text!",
  "file": {
    "url": "https://your-project.supabase.co/storage/v1/object/public/uploads/filename.pdf",
    "originalName": "document.pdf",
    "size": 1048576,
    "mimeType": "application/pdf"
  }
}
```

### 3. Download File
**GET** `/api/file/:id`

Download the file directly (redirects to Supabase public URL).

```bash
curl -L http://localhost:5000/api/file/60f7b3b3b3b3b3b3b3b3b3b3
```

### 4. Get All Shares
**GET** `/api/all`

Get a paginated list of all active shares.

```bash
curl "http://localhost:5000/api/all?page=1&limit=20"
```

### 5. Cleanup Management

**GET** `/api/cleanup/stats` - Get cleanup statistics
```bash
curl http://localhost:5000/api/cleanup/stats
```

**POST** `/api/cleanup` - Manually trigger cleanup
```bash
curl -X POST http://localhost:5000/api/cleanup
```

### 6. Health Check
**GET** `/health`

Check server status and configuration.

```bash
curl http://localhost:5000/health
```

## File Storage Architecture

### Supabase Integration
- **Storage**: Files are uploaded to Supabase Storage buckets
- **Public URLs**: Files are accessible via public Supabase URLs
- **Automatic Cleanup**: Files are deleted from Supabase when records expire
- **Reliability**: Cloud-based storage with high availability

### Cleanup Process
1. **TTL Expiration**: MongoDB automatically removes expired documents (3 hours)
2. **Pre-hook Cleanup**: Model hooks automatically delete files from Supabase
3. **Scheduled Cleanup**: Backup cleanup service runs every hour
4. **Manual Cleanup**: API endpoint for manual cleanup triggers

## Error Responses

- **400 Bad Request**: Invalid input or file too large
- **404 Not Found**: Content not found or expired
- **410 Gone**: Content has expired
- **500 Internal Server Error**: Server error

Example error response:
```json
{
  "error": "Content not found or has expired"
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/tempshare` | MongoDB connection string |
| `SUPABASE_URL` | - | Supabase project URL (required) |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Supabase service role key (recommended) |
| `SUPABASE_ANON_KEY` | - | Supabase anonymous key (fallback) |
| `SUPABASE_STORAGE_BUCKET` | `uploads` | Supabase storage bucket name |
| `FRONTEND_URL` | `*` | CORS allowed origin |
| `ENABLE_SCHEDULED_CLEANUP` | `true` | Enable automatic cleanup scheduling |

### File Upload Limits

- **Maximum file size**: 50MB
- **Supported file types**: All (no restrictions by default)
- **Storage location**: Supabase Storage (cloud-based)

### Expiration Settings

- **TTL (Time To Live)**: 3 hours (10800 seconds)
- **Automatic cleanup**: MongoDB TTL + Supabase file deletion
- **Scheduled cleanup**: Backup cleanup service runs every hour
- **Grace period**: Additional server-side expiration check

## Project Structure

```
Backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── supabase.js          # Supabase client and utilities
├── controllers/
│   └── shareController.js   # Business logic
├── middleware/
│   ├── upload.js            # Legacy Multer configuration
│   └── supabaseUpload.js    # Supabase upload middleware
├── models/
│   └── Share.js             # MongoDB schema with cleanup hooks
├── routes/
│   └── shareRoutes.js       # API routes
├── services/
│   └── cleanupService.js    # Automated cleanup service
├── uploads/                 # Legacy local storage (for migration)
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json             # Dependencies
└── server.js                # Main application file
```

## Development

### Running in Development Mode
```bash
npm run dev
```

This uses `nodemon` for automatic server restarts on file changes.

### Testing with curl

**Upload text:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Share", "text": "Test message"}'
```

**Upload file:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "title=File Share" \
  -F "file=@README.md"
```

**Retrieve content:**
```bash
curl http://localhost:5000/api/{YOUR_SHARE_ID}
```

**Check cleanup stats:**
```bash
curl http://localhost:5000/api/cleanup/stats
```

## MongoDB Schema

```javascript
{
  title: String,            // Required title for the share
  content: String,          // Text content (optional)
  fileUrl: String,          // Supabase public URL (optional)
  supabaseFilePath: String, // Internal Supabase file path
  originalFileName: String, // Original file name
  fileSize: Number,         // File size in bytes
  mimeType: String,         // File MIME type
  createdAt: {              // Creation timestamp
    type: Date,
    default: Date.now,
    expires: 10800          // TTL index - expires after 3 hours
  }
}
```

## Security Considerations

- File uploads are limited to 50MB
- MongoDB injection protection via Mongoose
- CORS configuration for frontend integration
- Supabase provides secure cloud storage
- No authentication required (temporary sharing service)
- Automatic file cleanup prevents storage bloat
- Public bucket access (consider signed URLs for sensitive files)

## Production Deployment

### Prerequisites
1. Set up Supabase project with storage bucket
2. Configure MongoDB (Atlas recommended)
3. Set all required environment variables

### Deployment Steps
1. Set `NODE_ENV=production`
2. Use production MongoDB URI
3. Configure Supabase with production settings
4. Set proper CORS origins
5. Enable scheduled cleanup
6. Add rate limiting and additional security measures
7. Set up logging and monitoring
8. Configure SSL/TLS

### Supabase Setup for Production
1. Create a new project in Supabase
2. Go to Storage → Create new bucket
3. Name it "uploads" (or customize)
4. Make it public for file downloads
5. Copy project URL and anon key to environment
6. Set up Row Level Security if needed

## Troubleshooting

### Row Level Security (RLS) Error
If you see: `StorageApiError: new row violates row-level security policy`

**Quick Fix**: Use the service role key instead of the anon key:
1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (not the anon key)
3. Add it to your `.env`: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
4. Restart your server

**Alternative**: Make your storage bucket public in the Supabase dashboard.

See `SUPABASE_RLS_FIX.md` for detailed solutions.

### File Upload Issues
- Ensure your Supabase bucket exists and is named correctly
- Check that your service role key is valid
- Verify your bucket has the correct permissions

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check your connection string in `.env`
- Verify network connectivity

## Monitoring and Maintenance

### Cleanup Monitoring
- Check `/api/cleanup/stats` for storage statistics
- Monitor Supabase storage usage in dashboard
- Set up alerts for failed cleanups

### Logs to Monitor
- File upload failures
- Cleanup operation results
- Supabase API errors
- MongoDB TTL operations

## License

ISC
