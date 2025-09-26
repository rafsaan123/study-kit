# Google Cloud Storage Integration

This document describes the Google Cloud Storage (GCS) integration for the Study Kit application.

## Overview

The application now uses Google Cloud Storage for file uploads and downloads instead of local file storage. This provides better scalability, reliability, and performance.

## Configuration

### 1. Service Account Key

The application uses a service account key file: `bteb-672bd-08e90aa5fe7c.json`

### 2. GCS Configuration

Configuration is managed in `config/gcs.config.ts`:

```typescript
export const GCS_CONFIG = {
  projectId: 'bteb-672bd',
  bucketName: 'study-kit-uploads',
  keyFilename: './bteb-672bd-08e90aa5fe7c.json',
};
```

### 3. Upload Folders

Files are organized in different folders:

- `content-attachments/` - Files attached to content (notices, assignments, etc.)
- `profile-images/` - User profile images
- `uploads/` - General uploads

## API Changes

### Upload API (`/api/upload`)

**Request:**
```javascript
const formData = new FormData();
formData.append('files', file);
formData.append('folder', 'content-attachments'); // Optional, defaults to 'uploads'

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```javascript
{
  success: true,
  files: [
    {
      fileName: "original-name.pdf",
      fileUrl: "https://storage.googleapis.com/study-kit-uploads/content-attachments/1234567890-abc123-original-name.pdf",
      fileType: "application/pdf",
      gcsPath: "content-attachments/1234567890-abc123-original-name.pdf"
    }
  ]
}
```

### Download API (`/api/download`)

**Request:**
```
GET /api/download?fileUrl=https://storage.googleapis.com/study-kit-uploads/content-attachments/file.pdf&originalName=file.pdf
```

**Response:**
- Redirects to a signed URL for secure file access
- Files are accessible for 1 hour via signed URLs

## Database Schema Changes

The `Content` model now includes `gcsPath` in attachments:

```typescript
const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  gcsPath: { type: String, required: false } // New field for GCS path
});
```

## File Management

### Upload Process

1. Files are uploaded to GCS with unique names
2. Files are made publicly accessible
3. GCS path and public URL are stored in database
4. Original filename is preserved for display

### Download Process

1. Check if file URL is a GCS URL
2. Generate signed URL for secure access
3. Redirect user to signed URL
4. Signed URLs expire after 1 hour

### Deletion Process

1. When content is deleted, associated GCS files are also deleted
2. Prevents orphaned files in storage
3. Maintains storage cost efficiency

## Migration from Local Storage

### Current Status

The system supports both local and GCS files for backward compatibility:

- **GCS Files**: `https://storage.googleapis.com/study-kit-uploads/...`
- **Local Files**: `/uploads/...` (legacy, will show error on download)

### Migration Steps

1. **Check for local files:**
   ```bash
   npm run ts-node scripts/migrate-to-gcs.ts
   ```

2. **Re-upload files:**
   - Use the content creation form to re-upload files
   - Files will automatically be stored in GCS

3. **Clean up local files:**
   - Remove files from `public/uploads/` directory
   - Update any hardcoded references

## Security Features

### Authentication
- All upload/download operations require user authentication
- Only authenticated users can access files

### Access Control
- Files are organized by user type and content
- Signed URLs provide time-limited access
- No direct public access to bucket

### File Validation
- File type validation on upload
- File size limits enforced
- Unique naming prevents conflicts

## Performance Benefits

### Scalability
- No server storage limitations
- Automatic scaling with Google Cloud
- Global CDN distribution

### Reliability
- 99.9% uptime SLA
- Automatic backups and redundancy
- No single point of failure

### Cost Efficiency
- Pay only for storage used
- No server maintenance costs
- Automatic lifecycle management

## Error Handling

### Upload Errors
- File size exceeded
- Invalid file type
- GCS service unavailable
- Authentication failed

### Download Errors
- File not found
- Expired signed URL
- Insufficient permissions
- GCS service unavailable

## Monitoring and Logging

### Upload Logs
- File upload attempts
- Success/failure rates
- File size and type statistics

### Download Logs
- Download requests
- Signed URL generation
- Access patterns

## Troubleshooting

### Common Issues

1. **Upload fails with authentication error**
   - Check service account key file
   - Verify bucket permissions
   - Ensure project ID is correct

2. **Download returns 404**
   - Check if file exists in GCS
   - Verify URL format
   - Check signed URL expiration

3. **Files not accessible**
   - Verify bucket is public
   - Check file permissions
   - Ensure correct folder structure

### Debug Commands

```bash
# Check GCS bucket contents
gsutil ls gs://study-kit-uploads/

# Check file permissions
gsutil acl get gs://study-kit-uploads/file-path

# Test upload
gsutil cp local-file gs://study-kit-uploads/test/
```

## Future Enhancements

### Planned Features
- Image optimization and resizing
- Video transcoding
- File versioning
- Advanced access controls
- Usage analytics

### Performance Optimizations
- Lazy loading for large files
- Progressive upload for large files
- Caching strategies
- CDN integration
