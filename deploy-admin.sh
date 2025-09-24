#!/bin/bash
# Deploy to aicareerx-admin project

echo "🚀 Deploying to aicareerx-admin project..."

# Switch to aicareerx-admin project
firebase use aicareerx-admin

# Build the admin dashboard
npm run build

# Deploy to aicareerx-admin project
firebase deploy

echo "✅ Deployed to aicareerx-admin successfully!"
