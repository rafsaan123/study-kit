import { Storage } from '@google-cloud/storage';
import path from 'path';
import { GCS_CONFIG } from '../config/gcs.config';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: GCS_CONFIG.projectId,
  // Use credentials from environment variable if available (for Vercel)
  ...(GCS_CONFIG.credentials ? { credentials: GCS_CONFIG.credentials } : { keyFilename: GCS_CONFIG.keyFilename }),
});

const bucketName = GCS_CONFIG.bucketName;
const bucket = storage.bucket(bucketName);

export interface UploadResult {
  fileName: string;
  fileUrl: string;
  fileType: string;
  gcsPath: string;
}

export class GCSService {
  /**
   * Upload a file to Google Cloud Storage
   */
  static async uploadFile(
    file: File,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.name);
      const baseName = path.basename(file.name, fileExtension);
      const fileName = `${timestamp}-${randomString}-${baseName}${fileExtension}`;
      
      // Create GCS path
      const gcsPath = `${folder}/${fileName}`;
      const gcsFile = bucket.file(gcsPath);

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to GCS
      await gcsFile.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly accessible
      await gcsFile.makePublic();

      // Generate public URL
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;

      return {
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        gcsPath,
      };
    } catch (error) {
      console.error('GCS upload error:', error);
      throw new Error('Failed to upload file to Google Cloud Storage');
    }
  }

  /**
   * Upload multiple files to Google Cloud Storage
   */
  static async uploadFiles(
    files: File[],
    folder: string = 'uploads'
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Google Cloud Storage
   */
  static async deleteFile(gcsPath: string): Promise<void> {
    try {
      const file = bucket.file(gcsPath);
      await file.delete();
    } catch (error) {
      console.error('GCS delete error:', error);
      throw new Error('Failed to delete file from Google Cloud Storage');
    }
  }

  /**
   * Get file metadata from Google Cloud Storage
   */
  static async getFileMetadata(gcsPath: string) {
    try {
      const file = bucket.file(gcsPath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('GCS metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  /**
   * Generate a signed URL for private file access
   */
  static async getSignedUrl(
    gcsPath: string,
    expiration: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      const file = bucket.file(gcsPath);
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiration * 1000,
      });
      return signedUrl;
    } catch (error) {
      console.error('GCS signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Check if bucket exists and create if it doesn't
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        await bucket.create({
          location: 'US',
          storageClass: 'STANDARD',
        });
        console.log(`Bucket ${bucketName} created successfully`);
      }
    } catch (error) {
      console.error('Bucket creation error:', error);
      throw new Error('Failed to create bucket');
    }
  }
}

// Initialize bucket on module load
GCSService.ensureBucketExists().catch(console.error);
