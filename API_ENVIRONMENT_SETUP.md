# API Environment Setup Guide

## 🔧 Environment Configuration

The app uses smart environment detection for API URLs. No manual configuration needed for basic setup.

### How it works

1. **Development**: Automatically detects localhost and uses `http://localhost:8000`
2. **Production**: Uses `https://api.aicareerx.com` (configurable)
3. **Environment Variable**: Override with `VITE_API_BASE_URL` if needed

## 🚀 Quick Setup

### Development (Automatic)
```bash
npm run dev
# Uses: http://localhost:8000/automation/send-invoice
```

### Production (Automatic)
```bash
npm run build
npm run deploy
# Uses: https://api.aicareerx.com/automation/send-invoice
```

## ⚙️ Custom Configuration

### Option 1: Environment Variable
Create `.env.local`:
```bash
VITE_API_BASE_URL=https://your-custom-api.com
```

### Option 2: Update Code
Edit `src/config/api.ts`:
```typescript
// Production fallback - replace with your actual production API URL
return 'https://your-production-api.com';
```

## 🌐 Deployment Platforms

### Firebase Hosting
1. Firebase Console → Project Settings → General
2. Your apps → Web app
3. Add environment variable: `VITE_API_BASE_URL`

### Vercel
1. Project Dashboard → Settings
2. Environment Variables
3. Add: `VITE_API_BASE_URL` = `https://your-api.com`

### Netlify
1. Site Settings → Environment Variables
2. Add: `VITE_API_BASE_URL` = `https://your-api.com`

## 🔍 Current Configuration

- **Development**: `http://localhost:8000/automation/send-invoice`
- **Production**: `https://api.aicareerx.com/automation/send-invoice`
- **Override**: Set `VITE_API_BASE_URL` environment variable

## ✅ Testing

### Test API Integration
1. Open browser DevTools → Network tab
2. Click "Send Invoice" button
3. Check the API call URL in Network tab
4. Verify it's calling the correct endpoint

### Debug API Issues
```javascript
// Check current API URL in browser console
console.log('API URL:', window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://api.aicareerx.com');
```

## 🛠️ Troubleshooting

### API calls going to localhost in production
- Check if `VITE_API_BASE_URL` is set correctly
- Verify the environment variable is loaded
- Check browser console for errors

### API calls failing
- Verify the API endpoint is accessible
- Check CORS configuration
- Test the API endpoint directly

## 📝 Notes

- The app automatically detects the environment
- No manual configuration needed for basic setup
- Environment variables override automatic detection
- All API calls include proper error handling
