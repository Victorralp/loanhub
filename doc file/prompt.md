# Simple Loan Application System (React + Firebase)

**Goal:** Build a simple loan management demo where:
1. Companies can register, log in, and approve/reject employee loan requests.
2. Employees can register, log in, and request loans (up to their salary).
3. The app is connected to Firebase for authentication and Firestore for data storage.

**Tech Stack:**
- Frontend: React (with Vite)
- Styling: Tailwind CSS (for minimal design)
- Backend: Firebase (Auth + Firestore)
- Deployment: Vercel (for frontend) + Firebase (for backend)

**Features:**
- **Company:**
  - Register/login
  - Dashboard with employee list
  - Approve/reject loan requests
- **Employee:**
  - Register/login
  - Dashboard to request loans and view loan status

**Firestore Structure:**
- `companies`: { id, name, email, balance }
- `employees`: { id, name, email, salary, companyId }
- `loans`: { id, employeeId, companyId, amount, status }

**Authentication:**
- Company and employee accounts use Firebase Email/Password authentication.

**Page Flow:**
- **Company** has two pages: Register, Login. After login, they are directed to the company dashboard.
- **Employee** has two pages: Register, Login. After login, they are directed to the employee dashboard.
- Loan requests are made by employees but require company admin approval.
