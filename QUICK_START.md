# 🚀 Quick Start Guide

## Get Started in 3 Steps

### Step 1: Start the Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

### Step 2: Register a Company
1. Click **"Company"** in the header or navigate to `/company/register`
2. Fill in the form:
   - **Company Name**: e.g., "Tech Solutions Inc"
   - **Email**: e.g., "admin@techsolutions.com"
   - **Password**: Choose a secure password
   - **Balance**: e.g., "100000"
3. Click **"Register"**
4. You'll be redirected to the login page

### Step 3: Login and Explore
1. Login with your company credentials
2. You'll see the Company Dashboard with:
   - Statistics cards
   - Empty employee list (no employees yet)
   - No pending loans
3. Keep this window open

---

## Test the Complete Flow

### 1. Register an Employee
1. Open a new incognito/private window (or logout)
2. Navigate to `/employee/register`
3. Fill in the form:
   - **Name**: e.g., "John Doe"
   - **Email**: e.g., "john@example.com"
   - **Password**: Choose a password
   - **Salary**: e.g., "5000"
   - **Company**: Select your company from dropdown
4. Click **"Register"**

### 2. Request a Loan (as Employee)
1. Login with employee credentials
2. In the Employee Dashboard, find **"Request Loan"** card
3. Enter an amount (must be ≤ salary): e.g., "3000"
4. Click **"Submit Request"**
5. See the loan appear in **"Loan History"** with status: **pending**

### 3. Approve the Loan (as Company)
1. Switch back to the company window (or login as company)
2. Refresh the dashboard
3. See the loan request in **"Pending Loan Requests"** table
4. Click **"Approve"** button
5. The loan disappears from pending and appears in **"All Loan Requests"** with status: **approved**

### 4. Check Employee Dashboard
1. Switch to employee window and refresh
2. See the loan status changed to **approved** (green badge)

---

## 🎯 Key Features to Test

### Company Dashboard
- ✅ View employee list
- ✅ See pending loan requests
- ✅ Approve loans
- ✅ Reject loans
- ✅ View complete loan history
- ✅ See statistics (pending loans, employees, total loans)
- ✅ Logout

### Employee Dashboard
- ✅ Request loans (validated: amount ≤ salary)
- ✅ View loan history with status badges
- ✅ See salary information
- ✅ Logout

### Authentication
- ✅ Protected routes (try accessing `/company/dashboard` without login)
- ✅ Auto-redirect if already logged in
- ✅ Session persistence (refresh page while logged in)

---

## 🔧 Troubleshooting

### "Firebase not configured" error
- Make sure `.env` file exists in the root directory
- Restart the development server after creating `.env`

### Can't see company in employee registration
- Make sure you've registered a company first
- Check Firebase console to verify company was created

### Loan not appearing in company dashboard
- Make sure the employee selected the correct company during registration
- Refresh the dashboard
- Check browser console for errors

### Changes not reflecting
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Restart development server

---

## 📱 Test Different Scenarios

### Scenario 1: Reject a Loan
1. Employee requests a loan
2. Company rejects it
3. Employee sees "rejected" status (red badge)

### Scenario 2: Multiple Employees
1. Register 2-3 employees for the same company
2. Each employee requests different loan amounts
3. Company sees all pending requests
4. Approve some, reject others

### Scenario 3: Loan Validation
1. Employee with salary $5,000 tries to request $6,000
2. System shows error: "Loan amount cannot exceed your salary"

### Scenario 4: Multiple Companies
1. Register Company A and Company B
2. Register employees for each company
3. Login as Company A - only see employees from Company A
4. Login as Company B - only see employees from Company B

---

## 🎨 UI Features to Notice

- **Gradient backgrounds** on all pages
- **Card shadows** with hover effects
- **Color-coded badges** (pending=gray, approved=green, rejected=red)
- **Toast notifications** for actions
- **Loading states** during data fetch
- **Responsive design** (try on mobile)
- **Modern header** with navigation

---

## 📊 Firebase Console

Want to see the data?
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **loan-manage-c2f66**
3. Navigate to **Firestore Database**
4. See collections:
   - `companies` - Your registered companies
   - `employees` - All employees
   - `loans` - All loan requests with status

---

## ✅ Success Checklist

- [ ] Company can register and login
- [ ] Employee can register and login
- [ ] Employee can request loans
- [ ] Company can see pending loans
- [ ] Company can approve loans
- [ ] Company can reject loans
- [ ] Employee sees updated loan status
- [ ] Protected routes work (redirect to login)
- [ ] Statistics update correctly
- [ ] Toast notifications appear

---

## 🎉 You're All Set!

The loan management system is fully functional. Explore all features and test different scenarios.

**Need help?** Check:
- `PROJECT_COMPLETE.md` - Full feature documentation
- `FIREBASE_SETUP.md` - Firebase configuration guide
- `README.md` - General project information

**Happy testing!** 🚀
