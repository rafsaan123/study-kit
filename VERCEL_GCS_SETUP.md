# Vercel Environment Variables Setup for GCS

## Method 1: Environment Variables (Recommended)

Instead of using a file, configure GCS using environment variables in Vercel:

### 1. Go to Vercel Dashboard
- Navigate to your project: `study-kit`
- Go to **Settings** → **Environment Variables**

### 2. Add Required Environment Variables

Add these environment variables:

```
GOOGLE_CLOUD_PROJECT_ID = bteb-672bd
GOOGLE_CLOUD_BUCKET_NAME = study-kit-uploads
GOOGLE_APPLICATION_CREDENTIALS_JSON = {"type":"service_account","project_id":"bteb-672bd",...}
```

### 3. Update GCS Configuration

Update `config/gcs.config.ts`:

```typescript
export const GCS_CONFIG = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'bteb-672bd',
  bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || 'study-kit-uploads',
  // Use environment variable instead of file
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined,
};
```

### 4. Update GCS Service

Update `services/gcsService.ts`:

```typescript
import { Storage } from '@google-cloud/storage';
import { GCS_CONFIG } from '../config/gcs.config';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: GCS_CONFIG.projectId,
  credentials: GCS_CONFIG.credentials,
});

const bucketName = GCS_CONFIG.bucketName;
const bucket = storage.bucket(bucketName);
```

## Method 2: Service Account Key File

If you prefer to use the key file:

### 1. Upload Key File to Vercel
- Go to **Settings** → **Environment Variables**
- Add a new variable:
  - **Name**: `GOOGLE_APPLICATION_CREDENTIALS`
  - **Value**: `./bteb-672bd-08e90aa5fe7c.json`

### 2. Add Key File to Project
- Place `bteb-672bd-08e90aa5fe7c.json` in your project root
- Add to `.gitignore` (already done)
- Commit and push the file

### 3. Update Vercel Configuration

Add to `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "./bteb-672bd-08e90aa5fe7c.json"
  }
}
```

## Method 3: Base64 Encoded Key (Alternative)

### 1. Encode Key File
```bash
base64 -i bteb-672bd-08e90aa5fe7c.json
```

### 2. Add to Vercel Environment Variables
- **Name**: `GOOGLE_APPLICATION_CREDENTIALS_BASE64`
- **Value**: `[base64 encoded content]`

### 3. Update GCS Service
```typescript
import { Storage } from '@google-cloud/storage';

const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
  ? JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString())
  : undefined;

const storage = new Storage({
  projectId: 'bteb-672bd',
  credentials,
});
```

## Recommended Approach: Method 1 (Environment Variables)

This is the most secure and Vercel-friendly approach:

### Step-by-Step Instructions:

1. **Get Service Account Key Content**:
   ```bash
   cat bteb-672bd-08e90aa5fe7c.json
   ```

2. **Copy the entire JSON content**

3. **In Vercel Dashboard**:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add new variable:
     - **Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
     - **Value**: `[paste the entire JSON content]`
     - **Environment**: Production, Preview, Development

4. **Update Configuration Files** (I'll help you with this)

## Security Benefits:
- ✅ No files in repository
- ✅ Encrypted storage in Vercel
- ✅ Easy rotation of credentials
- ✅ Environment-specific configuration
- ✅ No accidental exposure

## Next Steps:
1. Choose your preferred method
2. Update the configuration files
3. Deploy to Vercel
4. Test the upload/download functionality

Would you like me to help you implement Method 1 (Environment Variables) by updating the configuration files?
