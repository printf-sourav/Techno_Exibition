Extend the **Medisync healthcare supply chain platform** by implementing functional features in the **Hospital Dashboard and Waste Management Dashboard**, while improving the UI with subtle healthcare-themed animations and maintaining a clean, modern interface.

The platform already has multiple dashboards (Retailer, Hospital, NGO, Waste). Implement the following functionality.

---

# 1. Hospital Dashboard – Make Request Button Functional

Inside the **Hospital Dashboard**, the **Request Medicine button** should open an interactive popup form.

### Workflow

When a hospital clicks **Request Medicine**:

Open a modal popup containing the following inputs:

* Medicine Name (dropdown or text field)
* Quantity Required (number input)
* Priority Level (Low / Medium / High)
* Additional Notes (optional)

Then include a **Send Request** button.

### After Submission

1. The request should be sent to nearby **Retailers**.
2. Retailers should see this request in their **Nearby Demand Panel**.
3. Show confirmation message:

“Medicine request sent successfully. Nearby retailers have been notified.”

---

# 2. Hospital Dashboard – Create Request Feature

There is also a **Create Request** option in the hospital dashboard. Make it fully functional.

### Workflow

When **Create Request** is clicked:

Open a modal popup containing:

Medicine Name
Quantity Needed
Required Before Date
Priority Level
Optional Notes

Then include:

**Send Request**

### After Sending

The system should:

* Notify nearby retailers
* Add request to **Retailer Demand Panel**
* Display confirmation message:

“Request created and sent to nearby retailers.”

---

### UI Suggestions

Use card-style request components showing:

Medicine name
Requested quantity
Deadline
Priority

Urgent requests should have a **highlight or pulse effect**.

---

# 3. Waste Management Dashboard – Reschedule Pickup

In the **Waste Disposal Dashboard**, make the **Reschedule Pickup** button functional.

### Workflow

When **Reschedule Pickup** is clicked:

Open a popup window with:

Calendar date picker
Time picker
Optional notes field

After submitting:

1. The updated pickup schedule should be saved.
2. Retailer should receive notification:

“Waste pickup schedule has been updated.”

---

### Important Change

Remove the **Schedule Pickup form from the Waste Dashboard**.

Reason:

Only **Retailers schedule waste pickups**.
Waste agencies should **only manage and reschedule existing pickups**.

---

# 4. UI Improvements

Improve the UI for the Hospital and Waste dashboards.

Design goals:

Clean
Professional healthcare look
Minimal clutter
Soft medical color palette

Use:

Light background
Teal / blue accents
Card-based layouts
Clear spacing

---

# 5. Animations

Add subtle UI animations related to healthcare and medicine.

Examples:

Floating capsule icons in background
Smooth modal popup animations
Animated notification indicators
Calendar interactions with smooth transitions
Card hover elevation effects

Animations should feel modern but **not overwhelming**.

---

# 6. UX Improvements

Ensure the system feels like a real **healthcare logistics platform**.

Focus on:

Clear confirmation messages
Minimal steps for actions
Smooth transitions
Readable information hierarchy

---

# Final Deliverables

Updated system should include:

Functional **Hospital Request workflow**
Working **Create Request system**
Retailer notifications for requests
Functional **Waste Pickup Rescheduling**
Clean animated UI improvements for both dashboards
