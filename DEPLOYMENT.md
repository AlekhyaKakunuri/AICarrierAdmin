# Deployment Guide - AI CareerX

## 🚀 Production Deployment

### Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created
- Admin access to Firebase Console

### Step 1: Firebase Setup

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase in project**
   ```bash
   firebase init
   ```
   - Select: Hosting, Firestore
   - Use existing project: `aicareerx-51133`

3. **Configure Firebase**
   - Hosting public directory: `dist`
   - Single-page app: `Yes`
   - Overwrite index.html: `No`

### Step 2: Environment Configuration

1. **Update API Configuration**
   Edit `src/config/api.ts`:
   ```typescript
   // Production fallback - replace with your actual production API URL
   return 'https://your-production-api.com';
   ```

2. **Set Environment Variables** (Optional)
   Create `.env.production`:
   ```bash
   VITE_API_BASE_URL=https://your-production-api.com
   ```

### Step 3: Build and Deploy

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

3. **Deploy specific services**
   ```bash
   # Deploy only hosting
   npm run deploy:hosting
   
   # Deploy only Firestore rules
   npm run deploy:firestore
   ```

### Step 4: Post-Deployment Setup

1. **Firebase Console Setup**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project: `aicareerx-51133`

2. **Enable Authentication**
   - Authentication → Sign-in method
   - Enable: Email/Password, Google

3. **Configure Firestore**
   - Firestore Database → Rules
   - Deploy the rules from `firestore.rules`

4. **Create Admin User**
   - Go to Firestore Database
   - Create collection: `adminUsers`
   - Add document with your admin email:
     ```json
     {
       "email": "your-admin@email.com",
       "role": "admin",
       "name": "Admin User",
       "isActive": true,
       "createdAt": "timestamp"
     }
     ```

### Step 5: Domain Configuration (Optional)

1. **Custom Domain**
   - Firebase Console → Hosting
   - Add custom domain
   - Follow DNS configuration steps

2. **SSL Certificate**
   - Automatically provided by Firebase
   - HTTPS enabled by default

## 🔧 Environment-Specific Configuration

### Development
- **API URL**: `http://localhost:8000` (automatic)
- **Firebase**: Uses development project
- **Debug**: Full error logging enabled

### Production
- **API URL**: Set in `src/config/api.ts`
- **Firebase**: Uses production project
- **Debug**: Minimal logging
- **Performance**: Optimized build

## 📊 Monitoring and Maintenance

### Firebase Console
- **Analytics**: User engagement metrics
- **Performance**: App performance monitoring
- **Crashlytics**: Error tracking (if enabled)

### Logs and Debugging
- **Firebase Console**: Real-time logs
- **Browser DevTools**: Client-side debugging
- **Network Tab**: API call monitoring

## 🔐 Security Checklist

- [ ] Firestore security rules deployed
- [ ] Authentication providers configured
- [ ] Admin users created
- [ ] API endpoints secured
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] CORS configured (if needed)

## 🚨 Troubleshooting

### Common Issues

1. **Build fails**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Deployment fails**
   ```bash
   # Check Firebase login
   firebase login --reauth
   
   # Check project selection
   firebase use --add
   ```

3. **Admin dashboard not accessible**
   - Check admin user exists in Firestore
   - Verify Firestore security rules
   - Check browser console for errors

4. **API calls failing**
   - Verify API URL configuration
   - Check CORS settings
   - Test API endpoint directly

### Debug Commands
```bash
# Check Firebase project
firebase projects:list

# Check current project
firebase use

# View deployment logs
firebase hosting:channel:list

# Test Firestore rules
firebase firestore:rules:test
```

## 📈 Performance Optimization

### Build Optimization
- **Code splitting**: Automatic with Vite
- **Tree shaking**: Unused code removed
- **Minification**: CSS and JS minified
- **Asset optimization**: Images compressed

### Runtime Optimization
- **Lazy loading**: Components loaded on demand
- **Caching**: Firebase handles caching
- **CDN**: Global content delivery

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

## 📞 Support

For deployment issues:
1. Check Firebase Console logs
2. Review browser console errors
3. Verify configuration files
4. Contact development team

---

**Deployment completed successfully!** 🎉
