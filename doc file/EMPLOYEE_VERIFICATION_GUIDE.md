# Employee Verification Process Guide

## 🔄 Complete Workflow

### 1. Employee Registration
```
Employee → /employee/register → Fill Form → Account Created (status: "pending")
```

### 2. Company Dashboard
```
Company → /company/login → Dashboard → Employee Verification Section
```

### 3. Verification Actions
```
Company sees pending employees → Approve ✅ or Reject ❌
```

## 📋 Step-by-Step Instructions

### For Companies:

#### Step 1: Access Company Dashboard
1. Go to `/company/login`
2. Log in with company credentials
3. You'll see the Company Dashboard

#### Step 2: Find Employee Verification Section
- Look for the **"Employee Verification"** card
- It shows all employees waiting for verification
- If empty, it means no employees have registered yet

#### Step 3: Review Pending Employees
For each pending employee, you'll see:
- **Name**: Employee's full name
- **Email**: Employee's email address
- **Salary**: Employee's salary amount
- **Registered**: Date they registered
- **Actions**: Approve/Reject buttons

#### Step 4: Take Action
**To Approve:**
1. Click the green **"Approve"** button
2. Employee status changes to "verified"
3. Employee can now log in and request loans

**To Reject:**
1. Click the red **"Reject"** button
2. Enter a reason for rejection
3. Employee status changes to "rejected"
4. Employee cannot log in

## 🎯 What Happens After Verification

### Approved Employees:
- ✅ Can log in to employee dashboard
- ✅ Can request loans
- ✅ Appear in "Verified Employees" count
- ✅ Show up in "All Employees" list

### Rejected Employees:
- ❌ Cannot log in
- ❌ Cannot request loans
- ❌ Appear in "Rejected Employees" count
- ❌ Show up in "All Employees" list with rejected status

## 🔍 Troubleshooting

### "No pending employee verifications"
- This means no employees have registered yet
- Employees need to register first at `/employee/register`
- Once they register, they'll appear in the verification section

### "Employee not showing up"
- Check if employee selected the correct company during registration
- Verify the employee's `companyId` matches your company ID
- Check browser console for any error messages

### "Can't approve/reject employees"
- Make sure you're logged in as a company account
- Check your user role permissions
- Only company admins/managers can verify employees

## 📊 Dashboard Statistics

The company dashboard shows:
- **Pending Verification**: Employees waiting for approval
- **Verified Employees**: Successfully approved employees
- **Rejected**: Employees who were rejected
- **Pending Loans**: Loan requests awaiting approval
- **Approved Loans**: Successfully approved loans
- **Rejected Loans**: Declined loan requests

## 🚀 Testing the Process

### Create Test Employee:
1. Go to `/employee/register`
2. Fill out the registration form
3. Select your company from the dropdown
4. Submit the form
5. Employee will appear in your company dashboard verification section

### Verify Employee:
1. Go to company dashboard
2. Find the employee in "Employee Verification" section
3. Click "Approve" to verify them
4. Employee can now log in and request loans
