#!/bin/bash
# Deploy to aicareerx project

echo "🚀 Deploying to aicareerx project..."

# Set environment variable
export VITE_FIREBASE_PROJECT=aicareerx

# Switch to aicareerx project
firebase use aicareerx-51133

# Build with aicareerx config
npm run build

# Deploy
firebase deploy

echo "✅ Deployed to aicareerx successfully!"
