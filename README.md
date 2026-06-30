# MrMed - Enterprise Online Pharmacy & Healthcare SaaS Platform

A modern, scalable, and responsive online pharmacy and tele-consulting platform inspired by MrMed, Tata 1mg, and PharmEasy.

---

## Technical Architecture

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, React Query, Axios, Recharts, and Framer Motion.
- **Backend**: Node.js, Express, Sequelize ORM, MySQL Database, JWT with Role-Based Access Control (RBAC), and Redis caching.
- **Infrastructure**: Nginx reverse proxy, Docker, Multer storage, and PDFKit invoicing.

---

## Core Features & Workflows

1. **User Authentication & RBAC**:
   - Register standard Customer accounts.
   - Credentials login or simulated Google login.
   - Auto-mapped roles: `Admin` (ID: 1), `Pharmacist` (ID: 2), and `Customer` (ID: 3).

2. **Medicine Store Catalog**:
   - Advanced live filtering by categories, brands, price ranges, and sorting algorithms.
   - Search indexing across drug names, chemical compositions, and manufacturer titles.
   - Real-time Redis query listing cache.

3. **Prescription Verification Pipeline**:
   - Customers upload image files (.jpg, .png) or PDFs.
   - Pharmacists view document files, write notes, and change status to `Approved` or `Rejected`.
   - Cart system alerts customer if order requires doctor validation and halts checkout if no prescription is attached.

4. **Cart & Order Checkout**:
   - Dynamic calculations of savings, coupons, and GST details (18% inclusive).
   - Applied promo code discounts (e.g. `WELCOME10`, `HEALTH20`, `FLAT50`).
   - Payment processor interface (COD or simulated Razorpay).
   - Real-time stock reservation and automatic warehouse alerts.
   - PDF tax invoice downloads.

5. **Telehealth Clinic Consultation**:
   - Browse practitioners and doctor specialization filters.
   - Reserve online slots and write symptom logs.

6. **Admin Dashboard Controls**:
   - Area charts for monthly revenue streams and bar charts for customer acquisitions.
   - KPI metrics reporting totals for active users, pending prescription documents, and low-stock alerts.
   - Catalog tables to add promo codes, write health blogs, and edit hero slides.

---



## REST API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Sign up a new customer |
| `/api/auth/login` | POST | Public | Log in with credentials to retrieve JWT access tokens |
| `/api/auth/google` | POST | Public | Simulate Google OAuth sign-in |
| `/api/medicines` | GET | Public | Search and list medicines with filters (cached via Redis) |
| `/api/medicines/:id` | GET | Public | Fetch detailed active compositions and reviews |
| `/api/prescriptions/upload`| POST | Customer | Upload a local doctor prescription file |
| `/api/prescriptions/my` | GET | Customer | List uploaded files and pharmacist approval notes |
| `/api/prescriptions` | GET | Pharmacist | Review pending validations |
| `/api/orders` | POST | Customer | Place an order and deduct warehouse stock |
| `/api/orders/my` | GET | Customer | Track order timelines |
| `/api/orders/:id/invoice` | GET | Auth User | Download GST tax invoice PDF |
| `/api/appointments/book` | POST | Customer | Schedule video consult slots |
| `/api/admin/stats` | GET | Admin | Retrieve sales graphs and KPI metrics |

---

## Run Locally (With SQLite Fallback)

If you do not have MySQL or Redis running on your local machine, the Express server will **automatically fall back to an in-memory SQLite database** and seed it with demo medicines, banners, and blogs. This guarantees the application is runnable instantly.

### 1. Launch Backend:
```bash
cd backend
npm install
npm run dev
```
- Server starts on `http://localhost:5000`.

### 2. Launch Frontend:
```bash
cd ../frontend
npm install
npm run dev
```
- Site opens on `http://localhost:3000`.

---

## Deploy with Docker Compose

To orchestrate the full enterprise suite (Next.js, Node.js, Nginx, Redis, and MySQL):

```bash
docker-compose up -d --build
```
- Nginx reverse proxy binds to port **80**.
- Access the web interface directly on `http://localhost`.
