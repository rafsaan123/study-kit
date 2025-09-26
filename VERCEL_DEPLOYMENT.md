# 🚀 Vercel Deployment Guide for Study Kit

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **MongoDB Database**: Set up MongoDB Atlas or use another MongoDB service

## 🔧 Environment Variables Setup

### Required Environment Variables

Set these in your Vercel project settings:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-kit

# Application Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Optional Environment Variables

```bash
# External API (if using)
POOKIE_API_URL=https://your-pookie-api.com
```

## 🚀 Deployment Steps

### Method 1: Deploy from GitHub (Recommended)

1. **Connect GitHub Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your `rafsaan123/study-kit` repository

2. **Configure Project**:
   - Framework Preset: `Next.js`
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

### Method 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add MONGODB_URI
vercel env add NODE_ENV
vercel env add NEXT_TELEMETRY_DISABLED

# Redeploy with environment variables
vercel --prod
```

## 🔐 Security Configuration

### Generate NEXTAUTH_SECRET

```bash
# Generate a secure secret
openssl rand -base64 32
```

### MongoDB Security

1. **Create MongoDB Atlas Cluster**:
   - Go to [cloud.mongodb.com](https://cloud.mongodb.com)
   - Create a new cluster
   - Set up database user
   - Whitelist Vercel IP ranges

2. **Connection String Format**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/study-kit?retryWrites=true&w=majority
   ```

## 📁 File Structure for Vercel

```
study-kit/
├── app/                    # Next.js App Router
├── public/                 # Static assets
├── vercel.json            # Vercel configuration
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies
├── .env.example           # Environment variables template
└── VERCEL_DEPLOYMENT.md   # This guide
```

## ⚙️ Vercel Configuration

The `vercel.json` file includes:
- API route optimization
- CORS headers
- File serving configuration
- Function timeout settings

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (requires 18+)
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify MongoDB connection string

3. **API Routes**:
   - Check function timeout settings
   - Verify CORS configuration
   - Test API endpoints individually

### Debug Commands

```bash
# Test build locally
npm run build

# Check environment variables
vercel env ls

# View deployment logs
vercel logs [deployment-url]
```

## 📊 Performance Optimization

### Vercel Features Used

- **Edge Functions**: For API routes
- **Image Optimization**: Next.js Image component
- **Static Generation**: Pre-rendered pages
- **CDN**: Global content delivery

### Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: API route debugging
- **Build Logs**: Deployment troubleshooting

## 🔄 Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch triggers deployment
- Preview deployments for pull requests
- Automatic rollback on deployment failures

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

## ✅ Deployment Checklist

- [ ] GitHub repository connected
- [ ] Environment variables configured
- [ ] MongoDB database set up
- [ ] NEXTAUTH_SECRET generated
- [ ] Build test passed locally
- [ ] Domain configured (optional)
- [ ] SSL certificate active
- [ ] Application tested in production

Your Study Kit application is now ready for Vercel deployment! 🎉
