Extend the Medisync platform with **admin approval-based onboarding** and improved **UI/UX animations**, while strictly preserving all existing functionality.

The current system already supports role-based dashboards (Retailer, Hospital, NGO, Waste Agency). Implement the following enhancements.

---

# 1. Signup Approval Workflow (Admin Verification Required)

After a user completes the signup process, they **must NOT be redirected directly to their dashboard**.

Instead implement the following flow:

Signup → Account Created → Await Admin Approval → Login Enabled → Dashboard Access

### Behavior after signup

Immediately after successful signup:

Display a full-screen message page saying:

"Your account has been successfully created.
Please wait for Admin approval before accessing the platform."

Include:

Status indicator:
Account Status: Pending Approval

Optional UI elements:

Animated waiting indicator
Medicine capsule animation
Progress-style verification message

Example message card:

Account Under Review
Our team is verifying your submitted licenses and documents.
You will be able to log in once your account has been approved.

---

# 2. Prevent Login Before Approval

Users whose accounts are **Pending Verification** must not access dashboards.

If they attempt to log in:

Show message:

"Your account is still awaiting admin approval."

Include UI:

Pending verification badge
Document verification animation

Once the admin approves the account:

User can log in normally and access their dashboard.

---

# 3. Admin Approval Flow

Inside the **Admin Dashboard**, implement a verification system.

Admin should see a panel:

Pending User Verifications

Each card should show:

User name
Role (Retailer / Hospital / NGO / Waste Agency)
Uploaded license documents
Registration details

Admin actions:

Approve
Reject

When approved:

Account status changes to **Verified**.

User can now log in and access their dashboard.

---

# 4. Improve Landing Page Scroll Animations

Do not remove existing animations.

Add **more scroll-triggered Three.js animations** related to pharmacy logistics.

Examples:

Floating capsules appearing when sections scroll into view
Medicine boxes assembling into a supply chain network
Animated lines connecting pharmacy → hospital → NGO → waste facility
3D pill particles moving across the page
Medicine molecules slowly rotating

Animations should trigger when scrolling into new sections.

---

# 5. Improve UI/UX Across the Platform

Refine the UI of:

Login page
Signup forms
Dashboards
Verification screens

Goals:

Cleaner layout
Better spacing
Modern healthcare SaaS design
Smooth transitions

Use design elements such as:

Glass-style cards
Soft shadows
Rounded containers
Minimal gradients (medical blue / teal)

---

# 6. Add Three.js Elements to UI

Introduce subtle Three.js visuals throughout the platform.

Examples:

Floating capsules in dashboard backgrounds
Medicine particles moving slowly in empty spaces
Supply chain node animations
Soft glowing connection lines

These must remain subtle and not distract from functionality.

---

# 7. Improve Scroll Animations

Add scroll-triggered effects:

Cards sliding into view
Fade-in transitions
Floating medicine icons
Supply chain connection animations

Animations must feel smooth and professional.

---

# 8. Maintain Existing Functionality

STRICT RULE:

Do NOT modify any existing features, workflows, or APIs.

Only add:

Admin approval flow
Verification status system
Additional animations
UI/UX improvements

All current dashboards and functionality must remain unchanged.

---

# Goal

The platform should feel like a **modern healthcare logistics SaaS product** with secure onboarding, professional dashboards, smooth animations, and immersive medicine-themed visuals powered by Three.js.
