Build and extend the **Medisync platform UI and functionality**. The current system already has **three dashboards** (Retailer, Hospital, Waste Agency). Add a **fourth dashboard for NGOs** and implement the following functional features primarily in the **Retailer Dashboard**, while maintaining a **clean, modern healthcare UI with subtle medicine-related animations**.

---

## 1. Add a Fourth Dashboard – NGO Dashboard

Create a new **NGO Dashboard** with the following sections:

**Features**

* Incoming Donation Requests
* Accepted Donations
* Pickup Schedule
* Medicine Inventory Received
* NGO Activity Logs

**Workflow**

1. Retailer sends donation request.
2. NGO receives request in **Donation Requests Panel**.
3. NGO can **Accept or Reject**.
4. If accepted:

   * Notification sent to retailer.
   * Transport pickup scheduled.
   * Medicine moves to **NGO Inventory Panel**.

**UI**

* Cards showing pending donation requests.
* Accept / Reject buttons.
* Medicine icons and small animations when requests arrive.

---

# 2. Retailer Dashboard Enhancements

All the following functionality must be implemented in the **Medisync Retailer Dashboard**.

---

# A. Inventory Panel – Sell to Nearby Hospital

Inside the **Inventory Panel**, add an option:

**Button:**
“Sell to Nearby Hospital”

**Workflow**

When clicked:

1. Open a modal window containing:

   * Medicine Name
   * Batch Number
   * Available Quantity
   * Input field: **Number of packets to sell**
   * Input field: **Price per packet**

2. Add validation:

Price must be **less than MRP + GST**.

3. Select hospital from a dropdown list of **Nearby Hospitals**.

4. Show summary:

Medicine
Packets
Total Price

5. Confirmation button:

**Confirm Sale**

After confirmation:

Display a success message:

“Transport has been scheduled to pick up the medicines.”

---

**UI suggestions**

* Medicine card expands into modal.
* Smooth modal animation.
* Icons for capsules / medicine packets.
* Small truck animation on confirmation.

---

# B. Nearby Demand Panel – Supply Requested Medicines

In the **Nearby Demand section**:

Hospitals list medicines they need.

Add a button:

**“Supply Medicine”**

Workflow:

1. Retailer clicks supply.
2. Popup appears showing:

Medicine requested
Hospital name
Requested quantity

3. Retailer enters:

Selling price per packet.

Validation:

Price must be **less than MRP**.

4. Confirm supply.

After confirmation:

Show message:

“Transport scheduled for pickup.”

---

**UI**

* Demand cards
* Highlight urgent requests
* Pulse animation on urgent demand

---

# C. Donation System – Functional NGO Donations

On the **Retailer Dashboard**, the existing **Donate to NGOs** option should become fully functional.

Workflow:

1. Click **Donate** on a medicine.
2. Popup form opens:

Medicine name
Batch number
Available quantity

3. Input:

**Number of packets to donate**

4. Select NGO from dropdown.

5. Click **Send Donation Request**

---

NGO Flow:

* NGO receives request.
* NGO accepts or rejects.

If accepted:

Retailer receives notification:

“Your donation request has been accepted. Transport is scheduled for pickup.”

---

**UI**

* Heart / charity icon
* Smooth confirmation animation
* Donation success state

---

# D. Waste Disposal – Schedule Pickup Feature

Inside **Waste Disposal Panel**, make **Schedule Pickup** functional.

When clicked:

Open popup form with:

Medicine name
Batch number

Inputs:

Pickup date
Pickup time
Amount of waste (kg or packets)

Submit button:

**Schedule Pickup**

After confirmation:

Display notice:

“Pickup has been scheduled. A digital compliance certificate will be issued after disposal.”

---

**UI**

* Calendar date picker
* Clock time picker
* Waste icon
* Green confirmation animation

---

# 3. UI Improvements

Improve the UI to look more **modern and healthcare-focused**.

**Style**

* Clean layout
* Light background
* Soft gradients
* Medical teal / blue accents

**Design approach**

Minimal but slightly futuristic healthcare dashboard.

---

# 4. Animations

Add subtle animations related to medicines:

Examples:

* Floating capsule particles in background
* Medicine bottle icons rotating slowly
* Smooth dashboard transitions
* Transport truck animation when medicines are picked up
* Notification pulse for new hospital demand

Animations must be **lightweight and not distracting**.

---

# 5. Overall UX Goals

The platform should feel like a **real health-tech supply chain system**.

Focus on:

* clarity
* smooth user flow
* minimal clicks
* informative confirmation messages
* professional dashboard layout

---

# Final Deliverables

The updated system should include:

* 4 dashboards (Retailer, Hospital, NGO, Waste Agency)
* fully working retailer actions
* interactive modals
* confirmation workflows
* clean UI with subtle medicine-themed animations
