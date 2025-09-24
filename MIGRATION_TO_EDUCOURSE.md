# Migration Guide: aicareerx → eduCourse

## 🔄 Complete Migration Process

### Step 1: Get eduCourse Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `eduCourse` project
3. Go to Project Settings (gear icon) → General tab
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" → Web app
6. Copy the Firebase configuration

### Step 2: Update Firebase Configuration

Replace the configuration in `src/lib/firebase.ts`:

```typescript
// Your Firebase configuration for eduCourse project
const firebaseConfig = {
  apiKey: "YOUR_EDUCOURSE_API_KEY",
  authDomain: "eduCourse-XXXXX.firebaseapp.com",
  projectId: "eduCourse-XXXXX",
  storageBucket: "eduCourse-XXXXX.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### Step 3: Update Firebase CLI Project

```bash
# Login to Firebase (if not already logged in)
firebase login

# Switch to eduCourse project
firebase use eduCourse-XXXXX

# Or if you need to add the project first
firebase projects:list
firebase use --add eduCourse-XXXXX
```

### Step 4: Update Firebase Hosting Configuration

Update `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 5: Enable Required Services in eduCourse Project

#### 5.1 Enable Authentication
1. Go to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Enable "Google" provider (if using Google sign-in)

#### 5.2 Set up Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules (use the existing `firestore.rules`)

#### 5.3 Enable Firebase Hosting
1. Go to Hosting
2. Add a new site or use the default site

### Step 6: Data Migration

#### 6.1 Export Data from aicareerx
```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/aicareerx-backup

# Or use Firebase Admin SDK to export data
```

#### 6.2 Import Data to eduCourse
```bash
# Import Firestore data
gcloud firestore import gs://your-backup-bucket/aicareerx-backup
```

### Step 7: Update Environment Variables

If you have any environment variables, update them:

```bash
# Update .env file or environment variables
VITE_API_BASE_URL=https://your-production-api.com
```

### Step 8: Test the Migration

1. Build the project: `npm run build`
2. Deploy to eduCourse: `firebase deploy`
3. Test all functionality:
   - User authentication
   - Course enrollment
   - Payment processing
   - Admin dashboard
   - All user flows

### Step 9: Update Domain/DNS (if needed)

If you're using a custom domain:
1. Update DNS records to point to eduCourse hosting
2. Update SSL certificates
3. Update any external API configurations

## 📋 Migration Checklist

- [ ] Get eduCourse Firebase configuration
- [ ] Update `src/lib/firebase.ts`
- [ ] Switch Firebase CLI to eduCourse project
- [ ] Enable Authentication in eduCourse
- [ ] Set up Firestore Database in eduCourse
- [ ] Enable Firebase Hosting in eduCourse
- [ ] Export data from aicareerx
- [ ] Import data to eduCourse
- [ ] Update environment variables
- [ ] Test all functionality
- [ ] Deploy to eduCourse
- [ ] Update domain/DNS (if applicable)

## ⚠️ Important Notes

1. **Backup First**: Always backup your aicareerx data before migration
2. **Test Thoroughly**: Test all functionality after migration
3. **Update Documentation**: Update any documentation with new URLs
4. **Monitor**: Monitor the application after migration for any issues
5. **Rollback Plan**: Have a rollback plan ready in case of issues

## 🚨 Potential Issues

1. **Authentication**: Users may need to re-register if using different Firebase projects
2. **Data Loss**: Ensure all data is properly migrated
3. **API Keys**: Update any external API configurations
4. **Domain**: Update any hardcoded URLs or domains
5. **Environment**: Update all environment-specific configurations
