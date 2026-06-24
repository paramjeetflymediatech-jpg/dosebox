import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';
import AuthController from '../controllers/authController';
import MedicineController from '../controllers/medicineController';
import PrescriptionController from '../controllers/prescriptionController';
import OrderController from '../controllers/orderController';
import AppointmentController from '../controllers/appointmentController';
import AdminController from '../controllers/adminController';

const router = Router();

// ====================================================
// AUTH ROUTES
// ====================================================
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/google', AuthController.googleLogin);

// ====================================================
// MEDICINE CATALOG ROUTES
// ====================================================
router.get('/medicines', MedicineController.getMedicines);
router.get('/medicines/categories', MedicineController.getCategories);
router.get('/medicines/brands', MedicineController.getBrands);
router.get('/medicines/inventory/alerts', authenticateJWT, authorizeRoles('Admin'), MedicineController.getInventoryAlerts);
router.get('/medicines/:id', MedicineController.getMedicineById);
router.post('/medicines', authenticateJWT, authorizeRoles('Admin'), MedicineController.createMedicine);
router.put('/medicines/:id', authenticateJWT, authorizeRoles('Admin'), MedicineController.updateMedicine);
router.delete('/medicines/:id', authenticateJWT, authorizeRoles('Admin'), MedicineController.deleteMedicine);

// ====================================================
// PRESCRIPTION ROUTES
// ====================================================
router.post(
  '/prescriptions/upload',
  authenticateJWT,
  authorizeRoles('Customer'),
  upload.single('prescription'),
  PrescriptionController.uploadPrescription
);
router.get('/prescriptions/my', authenticateJWT, authorizeRoles('Customer'), PrescriptionController.getCustomerPrescriptions);
router.get('/prescriptions', authenticateJWT, authorizeRoles('Pharmacist', 'Admin'), PrescriptionController.getAllPrescriptions);
router.post('/prescriptions/:id/verify', authenticateJWT, authorizeRoles('Pharmacist', 'Admin'), PrescriptionController.verifyPrescription);

// ====================================================
// ORDER & BILLING ROUTES
// ====================================================
router.post('/orders', authenticateJWT, authorizeRoles('Customer', 'Pharmacist', 'Admin'), OrderController.createOrder);
router.get('/orders/my', authenticateJWT, authorizeRoles('Customer'), OrderController.getCustomerOrders);
router.get('/orders', authenticateJWT, authorizeRoles('Pharmacist', 'Admin'), OrderController.getAllOrders);
router.put('/orders/:id/status', authenticateJWT, authorizeRoles('Pharmacist', 'Admin'), OrderController.updateOrderStatus);
router.get('/orders/:id/invoice', authenticateJWT, OrderController.getInvoicePdf);

// ====================================================
// DOCTOR APPOINTMENTS / CLINIC ROUTES
// ====================================================
router.get('/appointments/doctors', AppointmentController.getDoctors);
router.post('/appointments/book', authenticateJWT, authorizeRoles('Customer'), AppointmentController.bookAppointment);
router.get('/appointments/my', authenticateJWT, authorizeRoles('Customer'), AppointmentController.getCustomerAppointments);
router.get('/appointments', authenticateJWT, authorizeRoles('Pharmacist', 'Admin'), AppointmentController.getAllAppointments);
router.put('/appointments/:id', authenticateJWT, authorizeRoles('Pharmacist', 'Admin'), AppointmentController.updateAppointment);

// ====================================================
// HEALTH BLOG ROUTES (PUBLIC & ADMIN)
// ====================================================
router.get('/admin/blogs', AdminController.getBlogs);
router.get('/admin/blogs/:slug', AdminController.getBlogBySlug);
router.post('/admin/blogs', authenticateJWT, authorizeRoles('Admin'), AdminController.createBlog);
router.delete('/admin/blogs/:id', authenticateJWT, authorizeRoles('Admin'), AdminController.deleteBlog);

// ====================================================
// ADMINISTRATIVE / DASHBOARD PORTALS ROUTES
// ====================================================
router.get('/admin/stats', authenticateJWT, authorizeRoles('Admin'), AdminController.getDashboardStats);
router.get('/admin/users', authenticateJWT, authorizeRoles('Admin'), AdminController.getUsers);
router.put('/admin/users/:id/status', authenticateJWT, authorizeRoles('Admin'), AdminController.updateUserStatus);

// Coupon & Promo configs
router.get('/admin/coupons', AdminController.getCoupons);
router.post('/admin/coupons', authenticateJWT, authorizeRoles('Admin'), AdminController.createCoupon);
router.delete('/admin/coupons/:id', authenticateJWT, authorizeRoles('Admin'), AdminController.deleteCoupon);

// Hero banners configurations
router.get('/admin/banners', AdminController.getBanners);
router.post('/admin/banners', authenticateJWT, authorizeRoles('Admin'), AdminController.createBanner);
router.delete('/admin/banners/:id', authenticateJWT, authorizeRoles('Admin'), AdminController.deleteBanner);

export default router;
