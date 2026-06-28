# Operation Blackout: TechAlfa Vault

Welcome to the CyberHunt platform for **Operation Blackout**, built by TechAlfa.

## Setup Instructions

This platform requires a connection to a **Firebase** backend (Firestore and Cloud Storage) to function.

### 1. Environment Variables
You must create a `.env.local` file in the root of the project to connect to Firebase.
Do **NOT** commit this file to version control.

Create `.env.local` and add the following keys:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_DOMAIN.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

# Firebase Admin Configuration (For Backend Operations)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@YOUR_PROJECT.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LONG_KEY\n-----END PRIVATE KEY-----\n"
```

### 2. Installation
Install all Node dependencies by running:
```bash
npm install
```

### 3. Running the Development Server
Once dependencies are installed and your `.env.local` is configured, start the server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture & Routes
- `/`: The main landing and login page.
- `/rules`: The Terms of Engagement onboarding page.
- `/dashboard`: The centralized hub for fragments, hints, and proof submissions.
- `/admin/login`: The secret admin portal.
- `/admin/submissions`: The volunteer control center for verifying proofs and disqualifying teams.

SUPABASE: COMMAND TO INSTALL 
npm install @supabase/supabase-js
PASS : eDKunpCMfs5QysVo
login for user : test@example.com
pass : TEST-ALPHA

FOR ADMIN : TECHALFA_ADMIN_2026



Email: test@example.com | ID/Passcode: TEST-ALPHA
Email: beta@example.com | ID/Passcode: TEST-BETA
Email: gamma@example.com | ID/Passcode: TEST-GAMMA
Email: delta@example.com | ID/Passcode: TEST-DELTA
Email: epsilon@example.com | ID/Passcode: TEST-EPSILON
Email: zeta@example.com | ID/Passcode: TEST-ZETA
Email: eta@example.com | ID/Passcode: TEST-ETA
Email: theta@example.com | ID/Passcode: TEST-THETA
Email: iota@example.com | ID/Passcode: TEST-IOTA
Email: kappa@example.com | ID/Passcode: TEST-KAPPA