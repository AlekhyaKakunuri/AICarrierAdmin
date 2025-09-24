#!/bin/bash
# Deploy to eduCourse project

echo "🚀 Deploying to eduCourse project..."

# Set environment variable
export VITE_FIREBASE_PROJECT=educourse

# Switch to eduCourse project
firebase use educourse-6b0c9

# Build with eduCourse config
npm run build

# Deploy
firebase deploy

echo "✅ Deployed to eduCourse successfully!"
