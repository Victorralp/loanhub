# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional)

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll add security rules later)
4. Select a location close to your users

## 4. Get Your Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

## 5. Update Firebase Configuration

Create a `.env` file in the root of your project and add your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

**Important:** 
- Never commit the `.env` file to version control (it's already in `.gitignore`)
- Use `.env.example` as a template for other developers
- The app will automatically load these environment variables

## 6. Firestore Security Rules (Optional but Recommended)

Go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Companies collection
    match /companies/{companyId} {
      allow read, write: if request.auth != null && request.auth.uid == companyId;
    }
    
    // Employees collection
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == employeeId;
    }
    
    // Loans collection
    match /loans/{loanId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

## 7. Test Your App

1. Start the development server: `npm start`
2. Register a company account
3. Register an employee account (select the company you just created)
4. Log in as employee and request a loan
5. Log in as company and approve/reject the loan

**Note:** After creating the `.env` file, you may need to restart the development server for the environment variables to be loaded.

## Firestore Collections Structure

### companies
- `id`: Auto-generated (matches Auth UID)
- `name`: string
- `email`: string
- `balance`: number
- `createdAt`: string (ISO date)

### employees
- `id`: Auto-generated (matches Auth UID)
- `name`: string
- `email`: string
- `salary`: number
- `companyId`: string (reference to company)
- `createdAt`: string (ISO date)

### loans
- `id`: Auto-generated
- `employeeId`: string (reference to employee)
- `companyId`: string (reference to company)
- `amount`: number
- `status`: string ("pending" | "approved" | "rejected")
- `createdAt`: string (ISO date)
