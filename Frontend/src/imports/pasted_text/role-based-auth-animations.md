Extend the Medisync prototype to support **role-based authentication and onboarding** for multiple types of users while enhancing the visual experience with additional **Three.js animations**.

IMPORTANT:
The **login / role selection page should appear only after the main landing page**.
Users first see the **landing page**, and when they click **Get Started / Login / Sign Up**, they are redirected to the **authentication page**.

The platform must support **five roles**:

Retailer (Pharmacy)
Hospital
NGO
Waste Disposal Agency
Admin

Each role should have its own dashboard and permissions.

---

# 1. Role-Based Login System

Create a unified **Login / Signup page** that appears after the landing page.

Users must select their role before logging in.

Role selection options:

Retailer (Pharmacy)
Hospital
NGO
Waste Disposal Agency
Admin

Flow:

Landing Page → Click Get Started/Login → Role Selection → Login → Redirect to dashboard.

Example redirect behavior:

Retailer → Retailer Dashboard
Hospital → Hospital Dashboard
NGO → NGO Dashboard
Waste Agency → Waste Management Dashboard
Admin → Admin Control Dashboard

Authentication must maintain secure sessions and protect routes.

---

# 2. Signup / Onboarding Requirements

Each role must provide **specific verification information during registration**.

---

# Retailer (Pharmacy) Onboarding

Fields required:

Pharmacy Name
Owner Name
Drug License Number
Upload Drug License Certificate
GST Number
Address
Contact Number
Email
Password

Verification:

Drug license must be uploaded as document (PDF/image).
AI or OCR should extract license number and expiry date if possible.

Account status remains:

Pending Verification
Verified
Rejected

Only verified retailers can access full dashboard features.

---

# Hospital Onboarding

Fields required:

Hospital Name
Hospital Registration Number
Upload Hospital License / Registration Certificate
Address
Contact Number
Email
Password

Verification:

Hospital registration certificate must be uploaded and approved.

---

# NGO Onboarding

Fields required:

NGO Name
NGO Registration Number
Upload NGO Registration Certificate
PAN / Tax Registration
Address
Contact Number
Email
Password

Verification:

NGO must upload proof of registration.

---

# Waste Disposal Agency Onboarding

Fields required:

Company Name
Biomedical Waste Handling License Number
Upload Waste Disposal Authorization Certificate
Service Area
Contact Number
Email
Password

Verification:

License must comply with biomedical waste regulations.

---

# 3. Admin Dashboard (Mandatory Role)

Add a dedicated **Admin Dashboard** responsible for platform oversight.

Admin responsibilities include:

Verifying pharmacy licenses
Verifying hospital registrations
Approving NGOs
Approving waste disposal agencies

Admin panel features:

User verification queue
Document viewer
Approve / Reject buttons
System activity overview
Platform statistics

Once a user is approved by Admin, they gain full dashboard access.

---

# 4. Role-Based Dashboard Access

After login, users must only see features relevant to their role.

Retailer Dashboard:
Inventory management
Nearby hospital demand
Medicine selling
NGO donations
Waste pickup scheduling

Hospital Dashboard:
Medicine request creation
Demand tracking

NGO Dashboard:
Donation requests
Medicine inventory received

Waste Agency Dashboard:
Waste pickup management
Pickup rescheduling

Admin Dashboard:
User verification
Platform monitoring

---

# 5. Improve Login UI

Design a modern healthcare-style authentication interface.

Include:

Role selection cards
Clean form layout
Glassmorphism login panels
Soft gradients using medical blue and teal

Add smooth transitions between login and dashboard.

---

# 6. Three.js Animation Enhancements

Keep the existing landing page animations unchanged.

Add additional **medicine-themed Three.js animations** to improve immersion.

Examples:

Floating capsules and tablets around login page
3D rotating medicine molecules
Animated supply chain globe connecting pharmacies, hospitals, NGOs, and waste facilities
Medicine boxes forming network nodes
Particle lines representing medicine distribution

Animations should trigger during scrolling and page transitions.

---

# 7. Dashboard Animation Improvements

Add subtle UI animations within dashboards:

Hover effects on cards
Animated notification indicators
Smooth modal popup transitions
Floating medicine icons in the background with low opacity

Animations must be subtle and not distracting.

---

# 8. Security Considerations

Authentication must include:

Password hashing
Secure sessions
Protected dashboard routes
Role-based access control

Users must not access dashboards without authentication.

---

# 9. Maintain Existing Functionality

IMPORTANT:

Do NOT modify existing features or workflows.

Only extend the system by adding:

Authentication
Role onboarding
Admin verification
Visual improvements

All previously implemented functionality must remain unchanged.

---

# Goal

The final system should feel like a **professional healthcare logistics platform**, with secure onboarding, role-based access control, admin verification, and immersive but clean Three.js animations.
