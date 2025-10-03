# Admin Dashboard Setup Guide

This guide will help you set up admin access to the dashboard.

## 🚀 Quick Setup (Recommended)

### Option 1: Simple Email-Based Admin (No Firestore Required)

1. **Edit Admin Configuration**
   - Open `src/config/adminConfig.ts`
   - Add your email to the `ADMIN_EMAILS` array:
   ```typescript
   export const ADMIN_EMAILS = [
     'admin@aicareerx.com',
     'jagad@aicareerx.com',
     'support@aicareerx.com',
     'your-email@example.com', // Add your email here
   ];
   ```

2. **Sign In**
   - Go to the admin dashboard
   - Sign in with your email
   - You should now have admin access!

### Option 2: Firestore-Based Admin (If you prefer using Firestore)

1. **Set up Firebase Admin SDK**
   ```bash
   npm install firebase-admin
   ```

2. **Get Service Account Key**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (`aicareerx-51133`)
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

3. **Create Admin Users**
   ```bash
   # Add default admin users
   node scripts/setupAdminUsers.js
   
   # Or add specific emails
   node scripts/setupAdminUsers.js admin@example.com user@example.com
   ```

4. **Revert to Firestore-based Admin**
   - Update `src/contexts/UserRoleContext.tsx` to use Firestore queries
   - Remove the email-based check

## 🔧 Configuration

### Adding More Admin Users

**For Email-Based Admin:**
1. Edit `src/config/adminConfig.ts`
2. Add emails to `ADMIN_EMAILS` array
3. Save and restart the app

**For Firestore-Based Admin:**
```bash
# Add single admin
node scripts/setupAdminUsers.js admin@example.com

# Add multiple admins
node scripts/setupAdminUsers.js admin1@example.com admin2@example.com

# List all admins
node scripts/setupAdminUsers.js list

# Remove admin
node scripts/setupAdminUsers.js remove admin@example.com
```

### Admin User Structure (Firestore)

If using Firestore, admin users are stored with this structure:
```json
{
  "email": "admin@example.com",
  "name": "Admin User",
  "role": "admin",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 🐛 Troubleshooting

### "Access Denied" or "Not Admin"

1. **Check Email Configuration**
   - Verify your email is in `ADMIN_EMAILS` array
   - Check for typos in email addresses
   - Ensure email is lowercase

2. **Check Authentication**
   - Make sure you're signed in
   - Try signing out and back in
   - Check browser console for errors

3. **Check Firestore (if using)**
   - Verify `adminUsers` collection exists
   - Check if your email is in the collection
   - Ensure Firestore rules allow reading

### "Loading Forever"

1. **Check Network Connection**
   - Ensure you can reach Firebase
   - Check browser network tab for failed requests

2. **Check Firebase Configuration**
   - Verify Firebase config is correct
   - Check if project ID matches

3. **Check Console Errors**
   - Open browser dev tools
   - Look for JavaScript errors
   - Check for authentication errors

## 🔐 Security Notes

### Email-Based Admin
- ✅ Simple and fast
- ✅ No Firestore dependency
- ⚠️ Admin emails are visible in client code
- ⚠️ Changes require code deployment

### Firestore-Based Admin
- ✅ More secure (admin list in database)
- ✅ Can be managed without code changes
- ✅ Better for multiple environments
- ⚠️ Requires Firestore setup
- ⚠️ Slightly slower (database query)

## 📝 Default Admin Emails

The following emails are configured as admin by default:
- `admin@aicareerx.com`
- `jagad@aicareerx.com`
- `support@aicareerx.com`

## 🚀 Next Steps

Once admin access is working:

1. **Test Admin Features**
   - View payment management
   - Check user plans management
   - Test custom claims functionality

2. **Set Up Custom Claims**
   - Follow `CUSTOM_CLAIMS_SETUP.md`
   - Test setting claims for users

3. **Configure Additional Admins**
   - Add team members as admins
   - Set up proper access controls

## 📞 Support

If you're still having issues:

1. Check the browser console for errors
2. Verify Firebase project configuration
3. Ensure your email is correctly added to admin list
4. Try the alternative setup method

---

**The admin dashboard should now be accessible! 🎉**
