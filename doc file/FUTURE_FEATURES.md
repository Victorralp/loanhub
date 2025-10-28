# Future Features TODO

## 🚀 Planned Enhancements

### 1. Loan Repayment System
**Priority: High**
- [ ] Track loan repayments with installment plans
- [ ] Show remaining balance and payment schedule
- [ ] Auto-calculate monthly deductions from salary
- [ ] Payment history for both company and employee
- [ ] Add payment status tracking (paid, pending, overdue)
- [ ] Generate payment receipts

**Implementation Notes:**
- Add `repayments` collection in Firestore
- Fields: `loanId`, `amount`, `date`, `status`, `remainingBalance`
- Update loan model to include `totalRepaid`, `remainingAmount`

---

### 2. Dashboard Analytics & Charts
**Priority: High**
- [ ] Visual charts showing loan trends (approved vs rejected)
- [ ] Monthly loan request statistics
- [ ] Employee borrowing patterns
- [ ] Company cash flow visualization
- [ ] Year-over-year comparison charts

**Tech Stack:**
- Use Recharts or Chart.js for visualizations
- Add date range filters
- Export chart data functionality

---

### 3. Notification System
**Priority: Medium**
- [ ] Real-time notifications for loan status changes
- [ ] Email notifications when loans are approved/rejected
- [ ] Alerts for pending loan requests (for companies)
- [ ] Reminder notifications for upcoming payments
- [ ] In-app notification center with badge counts

**Implementation:**
- Firebase Cloud Messaging for push notifications
- Email service integration (SendGrid/Nodemailer)
- Add `notifications` collection in Firestore
- Notification preferences in user settings

---

### 6. Employee Performance Tracking
**Priority: Medium**
- [ ] Attendance tracking system
- [ ] Performance ratings and reviews
- [ ] Salary adjustment history
- [ ] Bonus/incentive management
- [ ] Annual performance reports

**Database Schema:**
- `attendance` collection: `employeeId`, `date`, `status`, `checkIn`, `checkOut`
- `performance_reviews` collection: `employeeId`, `rating`, `comments`, `date`
- `salary_history` collection: `employeeId`, `oldSalary`, `newSalary`, `effectiveDate`

---

### 7. Document Upload System
**Priority: Medium**
- [ ] Upload loan supporting documents (ID, proof of need)
- [ ] Company document storage (contracts, policies)
- [ ] Profile pictures for users
- [ ] Document verification workflow
- [ ] Secure file storage with access controls

**Tech Stack:**
- Firebase Storage for file uploads
- File type validation (PDF, images)
- Maximum file size limits
- Document preview functionality

---

### 10. Dashboard Improvements
**Priority: Low**
- [ ] Quick action buttons (approve all, bulk actions)
- [ ] Recent activity feed
- [ ] Upcoming payment calendar
- [ ] Financial summary cards with trends (↑ ↓)
- [ ] Customizable dashboard widgets
- [ ] Export reports to PDF/Excel

---

### 12. Two-Factor Authentication
**Priority: Low**
- [ ] SMS or email verification
- [ ] Enhanced security for financial transactions
- [ ] Backup codes for account recovery
- [ ] Security audit logs

**Implementation:**
- Use Firebase Phone Authentication
- Add 2FA settings in user profile
- Require 2FA for sensitive actions (loan approval, large amounts)

---

## 📝 Notes
- Features are listed in order of suggested implementation priority
- Each feature should include proper error handling and loading states
- Add comprehensive tests for new features
- Update documentation as features are implemented
- Consider mobile responsiveness for all new UI components

---

## 🎯 Quick Wins (Small Improvements)
- [ ] Add loading skeletons for better UX
- [ ] Implement toast notifications for all actions
- [ ] Add confirmation dialogs for destructive actions
- [ ] Improve form validation with better error messages
- [ ] Add keyboard shortcuts for common actions
- [ ] Implement auto-save for forms
- [ ] Add breadcrumb navigation
- [ ] Create a help/FAQ section
