export const GCS_CONFIG = {
  projectId: 'bteb-672bd',
  bucketName: 'study-kit-uploads',
  keyFilename: './bteb-672bd-08e90aa5fe7c.json',
  // Alternative: use environment variables
  // projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'bteb-672bd',
  // bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || 'study-kit-uploads',
  // keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './bteb-672bd-08e90aa5fe7c.json',
};

export const UPLOAD_FOLDERS = {
  CONTENT_ATTACHMENTS: 'content-attachments',
  PROFILE_IMAGES: 'profile-images',
  GENERAL_UPLOADS: 'uploads',
} as const;
