# Customer Experience Guide: Payments & Refunds

This guide explains exactly what your customers see on their screens when they place orders, cancel orders, and use DoseBox Tokens. This is written from the perspective of the User Interface (UI), so it's perfect for customer support or non-technical staff to understand the platform.

---

## 1. The Checkout Screen (Buying Medicine)

When a customer is ready to buy their items, they go to the Checkout page. Here is what happens on their screen:

### Scenario A: They click "Cash on Delivery"
The yellow Tokens box instantly disappears. The app does not allow customers to use tokens on Cash orders because the delivery driver needs to collect the exact cash amount for the physical products.

![Checkout COD](file:///c:/Users/TEch/Desktop/letscode/dosebox/screenshots/1_checkout_cod.png)

### Scenario B: They click "PhonePe (Online)"
If the customer has tokens in their account from a previous refund, a yellow box appears that says **"DoseBox Tokens"** with their available balance. They can check a box to apply their tokens to the order. The screen instantly updates the "Total Payable" amount at the bottom, subtracting the token value like a discount.

![Checkout PhonePe](file:///c:/Users/TEch/Desktop/letscode/dosebox/screenshots/2_checkout_phonepe.png)

---

## 2. Customer Cancelling an Order

If a customer makes a mistake and wants to cancel an order, they go to their **"My Orders"** page and click the **"Cancel Order"** button. A popup window appears on their screen.

What the popup looks like depends on how they originally paid:

### Scenario A: They Paid Online (PhonePe)
The popup will ask them to choose between two options:
1. **Original Payment Method**: The screen says the money will go back to their bank/card in 5-7 days.
2. **DoseBox Tokens**: The screen offers to instantly refund the money to their DoseBox wallet, **plus a bonus** (50 or 100 extra tokens depending on the order size). 

*(Important Note: A small red warning text tells them that they can only use the Token Refund option twice in their lifetime for their own cancellations.)*

![Cancel PhonePe](file:///c:/Users/TEch/Desktop/letscode/dosebox/screenshots/3_orders_cancel_phonepe.png)

### Scenario B: They chose Cash on Delivery (COD)
Because they haven't actually paid any money yet, the popup looks very different!
- The "Original Payment Method" option is completely hidden.
- The screen simply says: **"Get 50 (or 100) Bonus Tokens instantly as an apology."**
- If they confirm, they receive those bonus tokens as a goodwill gesture for the inconvenience, but they do NOT get the order amount (since they never paid it). This still counts towards their 2-time lifetime limit.

![Cancel COD](file:///c:/Users/TEch/Desktop/letscode/dosebox/screenshots/4_orders_cancel_cod.png)

---

## 3. DoseBox Cancels an Order (E.g., Out of Stock)

When the pharmacy cancels an order (for example, if an item is out of stock), the customer gets an email. When they go to **"My Orders"**, they will see a bright button that says **"Claim Refund"**.

When they click it, a popup appears:
- They get to choose between **Original Payment Method** (Bank) or **DoseBox Tokens**.
- Because the cancellation was the pharmacy's fault, the system removes the 2-time lifetime limit restriction. They will get the full refund plus the bonus tokens without any penalties or warnings on the screen.

---

## 4. The Rewards Page

Customers can view their token history anytime by clicking on **"Rewards"** in their account menu.

On this screen, they will see a big yellow card showing their **Total Token Balance** and a list of their past transactions. If they received a refund in tokens, the list clearly breaks down the math so they aren't confused:
`₹[Refund Amount] + [Bonus Amount] Bonus = [Total Tokens Received]`
