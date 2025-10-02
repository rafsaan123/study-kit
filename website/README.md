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