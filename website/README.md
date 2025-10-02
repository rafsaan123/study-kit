# BTEB Result Search Website

A dedicated website for searching BTEB (Bangladesh Technical Education Board) results with a clean, modern interface.

## Features

- **Instant Result Search**: Search BTEB results with roll number, regulation, and program selection
- **Multiple Data Sources**: Access results from multiple databases with web API fallback
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface built with Tailwind CSS
- **Static Export**: Optimized for static hosting on Hostinger

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Pookie Backend API integration
- **Deployment**: Static export for Hostinger hosting

## Project Structure

```
website/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── result/
│   │   │       └── route.ts          # API route for result fetching
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page with result search
│   └── components/
│       └── Results.tsx               # Results component (standalone)
├── public/                           # Static assets
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the website directory:
   ```bash
   cd website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

1. Build the static site:
   ```bash
   npm run build
   ```

2. The built files will be in the `out/` directory, ready for deployment.

## Google Cloud Console Setup

### Prerequisites
- Google Cloud Platform account
- Billing enabled on your GCP project
- Domain name (optional, for custom domain)

### Step 1: Create a New Project

1. **Go to Google Cloud Console**:
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create Project**:
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name: `bteb-result-search`
   - Select organization (if applicable)
   - Click "Create"

3. **Select Project**:
   - Make sure your new project is selected in the project dropdown

### Step 2: Enable Required APIs

1. **Enable Cloud Storage API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Storage API"
   - Click on it and press "Enable"

2. **Enable Cloud Build API**:
   - Search for "Cloud Build API"
   - Click on it and press "Enable"

3. **Enable App Engine API** (for App Engine deployment):
   - Search for "App Engine Admin API"
   - Click on it and press "Enable"

### Step 3: Set Up Authentication

1. **Create Service Account**:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Name: `bteb-deployment`
   - Description: `Service account for BTEB website deployment`
   - Click "Create and Continue"

2. **Assign Roles**:
   - Add these roles:
     - `Storage Admin` (for Cloud Storage)
     - `Cloud Build Editor` (for Cloud Build)
     - `App Engine Admin` (for App Engine)
   - Click "Continue" and "Done"

3. **Create Key**:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download and save the key file securely

### Step 4: Configure Local Environment

1. **Install Google Cloud CLI**:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Windows (using Chocolatey)
   choco install gcloudsdk
   
   # Linux
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Set up Application Default Credentials**:
   ```bash
   gcloud auth application-default login
   ```

### Step 5: Deploy to Google Cloud

#### Option A: App Engine Deployment

1. **Create app.yaml**:
   ```yaml
   runtime: nodejs18
   env: standard
   
   handlers:
   - url: /.*
     script: auto
     static_files: out/index.html
     upload: out/index.html
   
   - url: /(.*)
     static_files: out/\1
     upload: out/(.*)
   ```

2. **Deploy**:
   ```bash
   cd website
   npm run build
   gcloud app deploy
   ```

#### Option B: Cloud Storage + Cloud CDN

1. **Create Storage Bucket**:
   ```bash
   gsutil mb gs://your-bucket-name
   ```

2. **Upload Files**:
   ```bash
   cd website
   npm run build
   gsutil -m cp -r out/* gs://your-bucket-name
   ```

3. **Make Bucket Public**:
   ```bash
   gsutil iam ch allUsers:objectViewer gs://your-bucket-name
   ```

4. **Set up Cloud CDN**:
   - Go to "Network Services" > "Cloud CDN"
   - Create a new CDN configuration
   - Point to your Cloud Storage bucket

#### Option C: Cloud Run (Containerized)

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 8080
   CMD ["npx", "serve", "out", "-p", "8080"]
   ```

2. **Build and Deploy**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/bteb-website
   gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/bteb-website --platform managed
   ```

### Step 6: Custom Domain Setup (Optional)

1. **Add Custom Domain**:
   - Go to "App Engine" > "Settings" > "Custom Domains"
   - Click "Add Custom Domain"
   - Follow the verification process

2. **Update DNS Records**:
   - Add the provided CNAME record to your domain's DNS settings
   - Wait for propagation (can take up to 24 hours)

### Step 7: Environment Variables (if needed)

1. **Set Environment Variables**:
   ```bash
   # For App Engine
   gcloud app deploy --set-env-vars="NODE_ENV=production"
   
   # For Cloud Run
   gcloud run deploy --set-env-vars="NODE_ENV=production"
   ```

### Step 8: Monitoring and Logging

1. **Enable Monitoring**:
   - Go to "Monitoring" > "Overview"
   - Set up alerts for your application

2. **View Logs**:
   - Go to "Logging" > "Logs Explorer"
   - Filter by your service name

### Step 9: Security Configuration

1. **Set up IAM**:
   - Go to "IAM & Admin" > "IAM"
   - Review and adjust permissions as needed

2. **Configure Firewall Rules**:
   - Go to "VPC Network" > "Firewall"
   - Create rules for your application

### Step 10: Cost Optimization

1. **Set up Budget Alerts**:
   - Go to "Billing" > "Budgets & Alerts"
   - Create a budget for your project

2. **Monitor Usage**:
   - Check "Billing" > "Reports" regularly
   - Optimize resources based on usage

### Troubleshooting

#### Common Issues:

1. **Authentication Errors**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Permission Denied**:
   - Check IAM roles for your service account
   - Ensure billing is enabled

3. **Build Failures**:
   - Check Cloud Build logs
   - Verify all dependencies are installed

4. **Deployment Issues**:
   - Check App Engine logs
   - Verify app.yaml configuration

#### Useful Commands:

```bash
# Check current project
gcloud config get-value project

# List all projects
gcloud projects list

# Switch project
gcloud config set project PROJECT_ID

# View logs
gcloud app logs tail -s default

# Check service status
gcloud app services list

# Update service
gcloud app deploy --version=VERSION_NUMBER
```

### Cost Estimation

**App Engine (Standard Environment)**:
- Free tier: 28 instance hours/day
- After free tier: ~$0.05-0.10 per hour

**Cloud Storage**:
- Free tier: 5GB storage, 1GB egress/month
- After free tier: ~$0.020 per GB storage, $0.12 per GB egress

**Cloud CDN**:
- Free tier: 1GB egress/month
- After free tier: ~$0.08-0.12 per GB

### Support Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [App Engine Documentation](https://cloud.google.com/appengine/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)

---

## Deployment on Hostinger

### Method 1: File Manager Upload

1. **Build the website**:
   ```bash
   npm run build
   ```

2. **Access Hostinger File Manager**:
   - Log into your Hostinger control panel
   - Go to File Manager
   - Navigate to `public_html` folder

3. **Upload files**:
   - Upload all contents from the `out/` directory
   - Make sure `index.html` is in the root of `public_html`

4. **Set up .htaccess** (optional, for better routing):
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [QSA,L]
   ```

### Method 2: FTP Upload

1. **Build the website**:
   ```bash
   npm run build
   ```

2. **Use FTP client** (FileZilla, WinSCP, etc.):
   - Connect to your Hostinger FTP
   - Upload all contents from `out/` to `public_html/`

### Method 3: Git Deployment (Advanced)

1. **Set up Git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Configure Hostinger Git**:
   - In Hostinger control panel, go to Git
   - Connect your repository
   - Set build command: `npm run build`
   - Set output directory: `out`

## Configuration

### API Configuration

The website uses the Pookie Backend API for fetching results. The API endpoint is configured in:
- `src/app/api/result/route.ts`

To change the API endpoint, modify the `pookieApiUrl` variable.

### Styling

The website uses Tailwind CSS for styling. Custom styles can be added in:
- `src/app/globals.css`

### Environment Variables

No environment variables are required for basic functionality. The API calls are made directly to the Pookie Backend API.

## API Integration

The website integrates with the Pookie Backend API to fetch BTEB results. The API expects:

**Request Parameters:**
- `studentId`: Student roll number (required)
- `regulation`: Regulation year (2010, 2016, 2022)
- `program`: Program type (Diploma in Engineering, etc.)

**Response Format:**
```json
{
  "exam": "string",
  "roll": number,
  "regulation": number,
  "institute": {
    "code": number,
    "name": "string",
    "district": "string"
  },
  "current_reffereds": [...],
  "semester_results": [...],
  "latest_result": {...}
}
```

## Troubleshooting

### Build Issues

1. **TypeScript errors**: Run `npm run lint` to check for issues
2. **Build failures**: Ensure all dependencies are installed with `npm install`
3. **Static export issues**: Check `next.config.ts` configuration

### Deployment Issues

1. **404 errors**: Ensure `index.html` is in the root of `public_html`
2. **API errors**: Check network connectivity and API endpoint
3. **Styling issues**: Verify all CSS files are uploaded correctly

### Performance Optimization

1. **Image optimization**: Images are set to `unoptimized: true` for static export
2. **Bundle size**: The build is optimized for static hosting
3. **Caching**: Consider adding cache headers in `.htaccess`

## Support

For issues or questions:
1. Check the console for error messages
2. Verify API connectivity
3. Ensure all files are uploaded correctly
4. Check Hostinger error logs

## License

This project is for educational purposes. All rights reserved.

---

**Note**: This website is designed specifically for BTEB result searching and is optimized for static hosting on Hostinger. The API integration relies on the Pookie Backend API service.