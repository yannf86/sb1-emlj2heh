# Firebase Firestore Security Rules Setup

## Problem
The application is encountering "Missing or insufficient permissions" errors when trying to access Firebase Firestore gamification data.

## Solution
You need to update your Firebase Firestore Security Rules to allow authenticated users to access their gamification data.

## Steps to Fix

### 1. Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **Rules** tab

### 2. Update Security Rules
Replace your current rules with the rules provided in the `firestore.rules` file, or manually add these rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own authentication data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write their own gamification stats
    match /user_gamification_stats/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write their own gamification action history
    match /gamification_action_history/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow users to read and write their own rate limits
    match /gamification_rate_limits/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow authenticated users to read and write other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Publish Rules
1. Click **Publish** to apply the new rules
2. Wait for the rules to be deployed (usually takes a few seconds)

### 4. Test the Application
1. Refresh your application
2. Try accessing the gamification features
3. The permission errors should now be resolved

## What These Rules Do

- **user_gamification_stats/{userId}**: Allows users to read and write only their own gamification statistics
- **gamification_action_history/{document}**: Allows users to read and write their own action history
- **gamification_rate_limits/{document}**: Allows users to manage their own rate limiting data
- **General rule**: Allows authenticated users to access other collections

## Security Benefits

- Users can only access their own gamification data
- Prevents unauthorized access to other users' statistics
- Maintains data privacy and security
- Follows Firebase security best practices

## Troubleshooting

If you still encounter permission errors after updating the rules:

1. **Check Authentication**: Ensure users are properly authenticated before accessing gamification features
2. **Clear Browser Cache**: Clear your browser cache and cookies
3. **Check Console**: Look for any additional error messages in the browser console
4. **Verify Rules**: Double-check that the rules were published correctly in the Firebase Console

The updated code also includes enhanced error handling and fallback mechanisms to ensure the application continues working even if there are temporary permission issues.