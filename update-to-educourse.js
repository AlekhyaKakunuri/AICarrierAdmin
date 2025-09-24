const fs = require('fs');
const path = require('path');

// Configuration for eduCourse project
// Replace these with your actual eduCourse Firebase configuration
const educourseConfig = {
  apiKey: "YOUR_EDUCOURSE_API_KEY",
  authDomain: "eduCourse-XXXXX.firebaseapp.com", 
  projectId: "eduCourse-XXXXX",
  storageBucket: "eduCourse-XXXXX.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

function updateFirebaseConfig() {
  console.log('🔄 Updating Firebase configuration...');
  
  const firebaseConfigPath = 'src/lib/firebase.ts';
  
  const newConfig = `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration for eduCourse project
const firebaseConfig = {
  apiKey: "${educourseConfig.apiKey}",
  authDomain: "${educourseConfig.authDomain}",
  projectId: "${educourseConfig.projectId}",
  storageBucket: "${educourseConfig.storageBucket}",
  messagingSenderId: "${educourseConfig.messagingSenderId}",
  appId: "${educourseConfig.appId}",
  measurementId: "${educourseConfig.measurementId}"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;`;

  fs.writeFileSync(firebaseConfigPath, newConfig);
  console.log('✅ Updated src/lib/firebase.ts');
}

function updateFirebaseJson() {
  console.log('🔄 Updating firebase.json...');
  
  const firebaseJson = {
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
  };
  
  fs.writeFileSync('firebase.json', JSON.stringify(firebaseJson, null, 2));
  console.log('✅ Updated firebase.json');
}

function updatePackageJson() {
  console.log('🔄 Updating package.json...');
  
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update project name and description
  packageJson.name = 'educourse-knowledge-pathways';
  packageJson.description = 'EduCourse - Knowledge Pathways Plus - Educational Platform';
  
  // Update deploy scripts
  packageJson.scripts.deploy = 'firebase deploy';
  packageJson.scripts['deploy:hosting'] = 'firebase deploy --only hosting';
  packageJson.scripts['deploy:firestore'] = 'firebase deploy --only firestore';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
}

function createEnvironmentFile() {
  console.log('🔄 Creating .env file...');
  
  const envContent = `# EduCourse Project Environment Variables
VITE_API_BASE_URL=https://api.educourse.com
VITE_FIREBASE_PROJECT_ID=${educourseConfig.projectId}
VITE_FIREBASE_AUTH_DOMAIN=${educourseConfig.authDomain}
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file');
}

function main() {
  console.log('🚀 Starting configuration update for eduCourse project...');
  console.log('');
  console.log('⚠️  IMPORTANT: Before running this script, make sure you have:');
  console.log('   1. Your eduCourse Firebase configuration');
  console.log('   2. Updated the educourseConfig object in this script');
  console.log('   3. Backed up your current configuration');
  console.log('');
  
  // Uncomment these lines after updating the educourseConfig
  // updateFirebaseConfig();
  // updateFirebaseJson();
  // updatePackageJson();
  // createEnvironmentFile();
  
  console.log('📋 Manual steps required:');
  console.log('   1. Update educourseConfig in this script with your actual values');
  console.log('   2. Uncomment the function calls above');
  console.log('   3. Run: node update-to-educourse.js');
  console.log('   4. Run: firebase use eduCourse-XXXXX');
  console.log('   5. Run: npm run build');
  console.log('   6. Run: firebase deploy');
}

main();
