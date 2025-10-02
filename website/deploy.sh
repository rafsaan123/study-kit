#!/bin/bash

# BTEB Result Search Website - Google Cloud Deployment Script
# This script automates the deployment process to Google Cloud Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed. Please install it first."
        print_status "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "Google Cloud CLI is installed"
}

# Check if user is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_warning "You are not authenticated with Google Cloud."
        print_status "Running: gcloud auth login"
        gcloud auth login
    fi
    print_success "Authentication verified"
}

# Get current project
get_project() {
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project is set. Please set a project first."
        print_status "Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    print_success "Using project: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required APIs..."
    
    gcloud services enable appengine.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable storage.googleapis.com
    
    print_success "APIs enabled successfully"
}

# Build the application
build_app() {
    print_status "Building the application..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm ci
    npm run build
    
    if [ ! -d "out" ]; then
        print_error "Build failed. 'out' directory not found."
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Deploy to App Engine
deploy_app_engine() {
    print_status "Deploying to App Engine..."
    
    if [ ! -f "app.yaml" ]; then
        print_error "app.yaml not found. Please ensure it exists."
        exit 1
    fi
    
    gcloud app deploy app.yaml --quiet
    
    print_success "Deployment to App Engine completed"
    
    # Get the URL
    URL=$(gcloud app browse --no-launch-browser)
    print_success "Your application is available at: $URL"
}

# Deploy to Cloud Storage
deploy_cloud_storage() {
    print_status "Deploying to Cloud Storage..."
    
    # Create bucket if it doesn't exist
    BUCKET_NAME="${PROJECT_ID}-bteb-website"
    
    if ! gsutil ls gs://$BUCKET_NAME &> /dev/null; then
        print_status "Creating bucket: $BUCKET_NAME"
        gsutil mb gs://$BUCKET_NAME
    fi
    
    # Upload files
    print_status "Uploading files to bucket..."
    gsutil -m cp -r out/* gs://$BUCKET_NAME
    
    # Make bucket public
    print_status "Making bucket public..."
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    
    # Set up website configuration
    print_status "Setting up website configuration..."
    gsutil web set -m index.html -e 404.html gs://$BUCKET_NAME
    
    print_success "Deployment to Cloud Storage completed"
    print_success "Your website is available at: https://storage.googleapis.com/$BUCKET_NAME/index.html"
}

# Deploy to Cloud Run
deploy_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    # Build and push container
    print_status "Building container image..."
    gcloud builds submit --tag gcr.io/$PROJECT_ID/bteb-website
    
    # Deploy to Cloud Run
    print_status "Deploying to Cloud Run..."
    gcloud run deploy bteb-website \
        --image gcr.io/$PROJECT_ID/bteb-website \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --port 3000
    
    print_success "Deployment to Cloud Run completed"
    
    # Get the URL
    URL=$(gcloud run services describe bteb-website --platform managed --region us-central1 --format 'value(status.url)')
    print_success "Your application is available at: $URL"
}

# Main deployment function
main() {
    print_status "Starting BTEB Result Search Website deployment..."
    
    # Parse command line arguments
    DEPLOYMENT_TYPE="app-engine"  # Default deployment type
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                DEPLOYMENT_TYPE="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--type TYPE]"
                echo "Deployment types: app-engine, cloud-storage, cloud-run"
                echo "Default: app-engine"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    check_gcloud
    check_auth
    get_project
    enable_apis
    build_app
    
    # Deploy based on type
    case $DEPLOYMENT_TYPE in
        "app-engine")
            deploy_app_engine
            ;;
        "cloud-storage")
            deploy_cloud_storage
            ;;
        "cloud-run")
            deploy_cloud_run
            ;;
        *)
            print_error "Invalid deployment type: $DEPLOYMENT_TYPE"
            print_status "Valid types: app-engine, cloud-storage, cloud-run"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed successfully!"
    print_status "Don't forget to set up monitoring and budget alerts in Google Cloud Console."
}

# Run main function
main "$@"
