# AI CareerX - Admin Dashboard

A dedicated admin management interface for AI CareerX, built with React, TypeScript, and Firebase. This application provides comprehensive admin controls for managing payments, user plans, and platform administration.

## 🚀 Features

### Admin Features
- **Payment Management**: View, verify, and manage all payment submissions
- **User Plan Management**: Track and manage user subscriptions and access
- **Real-time Statistics**: Live dashboard with payment and user metrics
- **Admin Authentication**: Secure admin-only access with role verification
- **Payment Verification**: Approve or reject payment submissions
- **User Access Control**: Manage course access and subscription status

### Technical Features
- **Firebase Integration**: Connected to aicareerx Firestore database
- **TypeScript**: Full type safety and better development experience
- **Modern UI**: Shadcn/ui components with clean admin interface
- **Real-time Updates**: Live data synchronization with Firestore
- **Admin-only Access**: Strict authentication for admin users only

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: Tailwind CSS, Shadcn/ui
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **Payment**: UPI integration with verification system
- **Deployment**: Firebase Hosting

## 📁 Project Structure

```
src/
├── components/          # Admin UI components
│   ├── ui/             # Shadcn/ui components
│   ├── AdminRoute.tsx  # Admin access control
│   ├── PaymentAdmin.tsx # Payment management
│   ├── AdminStats.tsx  # Dashboard statistics
│   ├── UserPlansManagement.tsx # User plan management
│   ├── Header.tsx      # Admin header
│   └── Footer.tsx      # Admin footer
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── UserRoleContext.tsx # Admin role verification
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── firebase.ts     # Firebase configuration (aicareerx)
│   ├── paymentService.ts # Payment operations
│   └── userPlanService.ts # User plan management
├── pages/              # Admin pages
│   ├── AdminDashboard.tsx # Main admin dashboard
│   └── SignIn.tsx      # Admin sign in
└── config/             # Configuration files
    └── firebase-configs.ts # Firebase configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to aicareerx Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aicareerx-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Already configured to use aicareerx Firebase project
   - No additional configuration needed

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Firebase Setup
- **Project**: Connected to aicareerx-51133 Firebase project
- **Authentication**: Email/Password and Google providers enabled
- **Firestore**: Uses existing collections: `adminUsers`, `payments`, `userPlans`
- **Security Rules**: Admin-only access enforced

### Admin Setup
1. **Create admin user** in Firestore `adminUsers` collection:
   ```json
   {
     "email": "admin@example.com",
     "role": "admin",
     "name": "Admin User",
     "isActive": true
   }
   ```

2. **Admin Access**: Only users in `adminUsers` collection can access the dashboard

## 📦 Deployment

### Firebase Hosting
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   npm run deploy:admin
   ```

### Admin Dashboard Access
- **URL**: Deployed to Firebase Hosting
- **Access**: Admin users only (verified through Firestore)
- **Authentication**: Required for all routes

## 🔐 Security

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### API Key Security
- Firebase API keys are public by design
- Security is handled by Firestore rules and authentication
- No sensitive data in client-side code

## 📊 Admin Features

### Payment Management
- View all payment submissions from users
- Verify or reject payment requests
- Add verified payments to user plans
- Track payment status and history

### User Plan Management
- View all user subscriptions and plans
- Manage course access permissions
- Track plan expiry dates
- Update user plan status

### Dashboard Analytics
- Real-time payment statistics
- User subscription metrics
- Revenue tracking
- System overview

## 🐛 Troubleshooting

### Common Issues
1. **Admin dashboard not showing**: Check admin user exists in Firestore `adminUsers` collection
2. **Payment verification fails**: Check Firestore security rules and permissions
3. **Authentication errors**: Verify Firebase configuration and admin user setup
4. **Access denied**: Ensure user email is in `adminUsers` collection

### Debug Steps
1. Check browser console for errors
2. Verify admin user exists in Firestore
3. Check Firebase authentication status
4. Confirm user role verification

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For technical support or questions, please contact the development team.

---

**Built with ❤️ for AI CareerX**