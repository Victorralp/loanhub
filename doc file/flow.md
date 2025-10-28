# Flow of the Loan Application System

## 1. Company Registers
- **Fields:** Company name, email, password, balance
- Creates a new company document in Firestore.
- Redirect to login page upon successful registration.

## 2. Company Logs In
- Authenticate with Firebase.
- Redirect to company dashboard.

## 3. Company Dashboard
- View employee list (linked by companyId).
- View pending loan requests from employees (loans with status 'pending').
- Approve or reject loan requests:
  - Approve: Update loan status to 'approved'.
  - Reject: Update loan status to 'rejected'.

## 4. Employee Registers
- **Fields:** Name, email, password, salary, companyId (select company)
- Creates a new employee document in Firestore.
- Redirect to login page upon successful registration.

## 5. Employee Logs In
- Authenticate with Firebase.
- Redirect to employee dashboard.

## 6. Employee Dashboard
- View their salary and company information.
- Request a loan (amount must not exceed salary).
- View loan status (pending, approved, rejected).
