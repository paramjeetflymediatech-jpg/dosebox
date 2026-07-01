import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// ----------------------------------------------------
// 1. ROLE
// ----------------------------------------------------
export interface RoleAttributes {
  id: number;
  name: string;
}
export class Role extends Model<RoleAttributes, Optional<RoleAttributes, 'id'>> implements RoleAttributes {
  declare id: number;
  declare name: string;
}
Role.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, modelName: 'Role', tableName: 'roles', timestamps: false }
);

// ----------------------------------------------------
// 2. USER
// ----------------------------------------------------
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  phone?: string;
  avatar?: string;
  rewardPoints?: number;
  roleId: number;
  status: string; // 'active' | 'inactive'
}
export class User extends Model<UserAttributes, Optional<UserAttributes, 'id' | 'password' | 'googleId' | 'phone' | 'avatar' | 'rewardPoints' | 'status'>> implements UserAttributes {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password?: string;
  declare googleId?: string;
  declare phone?: string;
  declare avatar?: string;
  declare rewardPoints?: number;
  declare roleId: number;
  declare status: string;
  declare role?: Role;
}
User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },
    googleId: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    avatar: { type: DataTypes.STRING, allowNull: true },
    rewardPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
  },
  { sequelize, modelName: 'User', tableName: 'users', timestamps: true }
);

// ----------------------------------------------------
// 3. ADDRESS
// ----------------------------------------------------
export interface AddressAttributes {
  id: number;
  userId: number;
  title: string; // e.g. 'Home', 'Work'
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}
export class Address extends Model<AddressAttributes, Optional<AddressAttributes, 'id' | 'isDefault'>> implements AddressAttributes {
  declare id: number;
  declare userId: number;
  declare title: string;
  declare street: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare country: string;
  declare isDefault: boolean;
}
Address.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    street: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    zipCode: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Address', tableName: 'addresses', timestamps: true }
);

// ----------------------------------------------------
// 4. CATEGORY
// ----------------------------------------------------
export interface CategoryAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}
export class Category extends Model<CategoryAttributes, Optional<CategoryAttributes, 'id' | 'description' | 'image'>> implements CategoryAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare description?: string;
  declare image?: string;
}
Category.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: 'Category', tableName: 'categories', timestamps: true }
);

// ----------------------------------------------------
// 5. BRAND
// ----------------------------------------------------
export interface BrandAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}
export class Brand extends Model<BrandAttributes, Optional<BrandAttributes, 'id' | 'description' | 'logo'>> implements BrandAttributes {
  declare id: number;
  declare name: string;
  declare slug: string;
  declare description?: string;
  declare logo?: string;
}
Brand.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: 'Brand', tableName: 'brands', timestamps: true }
);

// ----------------------------------------------------
// 6. MEDICINE
// ----------------------------------------------------
export interface MedicineAttributes {
  id: number;
  name: string;
  genericName: string;
  brandId: number;
  manufacturer: string;
  composition: string;
  dosage: string;
  description?: string;
  sideEffects?: string;
  storageInstructions?: string;
  prescriptionRequired: boolean;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string; // JSON array string
  categoryId: number;
}
export class Medicine extends Model<MedicineAttributes, Optional<MedicineAttributes, 'id' | 'description' | 'sideEffects' | 'storageInstructions' | 'discountPrice' | 'prescriptionRequired' | 'stock' | 'images'>> implements MedicineAttributes {
  declare id: number;
  declare name: string;
  declare genericName: string;
  declare brandId: number;
  declare manufacturer: string;
  declare composition: string;
  declare dosage: string;
  declare description?: string;
  declare sideEffects?: string;
  declare storageInstructions?: string;
  declare prescriptionRequired: boolean;
  declare price: number;
  declare discountPrice?: number;
  declare stock: number;
  declare images: string;
  declare categoryId: number;
}
Medicine.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    genericName: { type: DataTypes.STRING, allowNull: false },
    brandId: { type: DataTypes.INTEGER, allowNull: false },
    manufacturer: { type: DataTypes.STRING, allowNull: false },
    composition: { type: DataTypes.STRING, allowNull: false },
    dosage: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    sideEffects: { type: DataTypes.TEXT, allowNull: true },
    storageInstructions: { type: DataTypes.STRING, allowNull: true },
    prescriptionRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discountPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    images: { type: DataTypes.TEXT, defaultValue: '[]' },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Medicine', tableName: 'medicines', timestamps: true }
);

// ----------------------------------------------------
// 7. INVENTORY
// ----------------------------------------------------
export interface InventoryAttributes {
  id: number;
  medicineId: number;
  minStockAlertThreshold: number;
  locationInWarehouse?: string;
}
export class Inventory extends Model<InventoryAttributes, Optional<InventoryAttributes, 'id' | 'locationInWarehouse'>> implements InventoryAttributes {
  declare id: number;
  declare medicineId: number;
  declare minStockAlertThreshold: number;
  declare locationInWarehouse?: string;
}
Inventory.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    medicineId: { type: DataTypes.INTEGER, allowNull: false },
    minStockAlertThreshold: { type: DataTypes.INTEGER, defaultValue: 10 },
    locationInWarehouse: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: 'Inventory', tableName: 'inventory', timestamps: true }
);

// ----------------------------------------------------
// 8. PRESCRIPTION
// ----------------------------------------------------
export interface PrescriptionAttributes {
  id: number;
  userId: number;
  fileUrl: string;
  fileType: string; // 'png' | 'jpg' | 'pdf'
  status: string; // 'Pending' | 'Approved' | 'Rejected'
  notes?: string;
  verifiedById?: number;
}
export class Prescription extends Model<PrescriptionAttributes, Optional<PrescriptionAttributes, 'id' | 'status' | 'notes' | 'verifiedById'>> implements PrescriptionAttributes {
  declare id: number;
  declare userId: number;
  declare fileUrl: string;
  declare fileType: string;
  declare status: string;
  declare notes?: string;
  declare verifiedById?: number;
}
Prescription.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    fileUrl: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    verifiedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'Prescription', tableName: 'prescriptions', timestamps: true }
);

// ----------------------------------------------------
// 9. ORDER
// ----------------------------------------------------
export interface OrderAttributes {
  id: number;
  userId: number;
  prescriptionId?: number;
  status: string; // 'Pending' | 'Prescription Review' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out For Delivery' | 'Delivered' | 'Cancelled'
  totalAmount: number;
  discountAmount: number;
  gstAmount: number;
  finalAmount: number;
  paymentStatus: string; // 'Unpaid' | 'Paid' | 'Failed' | 'Refunded'
  paymentMethod: string; // 'COD' | 'Razorpay' | 'PhonePe'
  trackingTimeline: string; // JSON Array string
  couponId?: number;
  shippingAddressId: number;
  transactionId?: string;
  refundedToPoints?: boolean;
}
export class Order extends Model<OrderAttributes, Optional<OrderAttributes, 'id' | 'prescriptionId' | 'status' | 'discountAmount' | 'gstAmount' | 'paymentStatus' | 'paymentMethod' | 'trackingTimeline' | 'couponId' | 'transactionId' | 'refundedToPoints'>> implements OrderAttributes {
  declare id: number;
  declare userId: number;
  declare prescriptionId?: number;
  declare status: string;
  declare totalAmount: number;
  declare discountAmount: number;
  declare gstAmount: number;
  declare finalAmount: number;
  declare paymentStatus: string;
  declare paymentMethod: string;
  declare trackingTimeline: string;
  declare couponId?: number;
  declare shippingAddressId: number;
  declare transactionId?: string;
  declare refundedToPoints?: boolean;
}
Order.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    prescriptionId: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    gstAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    finalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentStatus: { type: DataTypes.STRING, defaultValue: 'Unpaid' },
    paymentMethod: { type: DataTypes.STRING, defaultValue: 'COD' },
    trackingTimeline: { type: DataTypes.TEXT, defaultValue: '[]' },
    couponId: { type: DataTypes.INTEGER, allowNull: true },
    shippingAddressId: { type: DataTypes.INTEGER, allowNull: false },
    transactionId: { type: DataTypes.STRING, allowNull: true },
    refundedToPoints: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Order', tableName: 'orders', timestamps: true }
);

// ----------------------------------------------------
// 10. ORDER ITEM
// ----------------------------------------------------
export interface OrderItemAttributes {
  id: number;
  orderId: number;
  medicineId: number;
  quantity: number;
  price: number;
}
export class OrderItem extends Model<OrderItemAttributes, Optional<OrderItemAttributes, 'id'>> implements OrderItemAttributes {
  declare id: number;
  declare orderId: number;
  declare medicineId: number;
  declare quantity: number;
  declare price: number;
}
OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    medicineId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { sequelize, modelName: 'OrderItem', tableName: 'order_items', timestamps: false }
);

// ----------------------------------------------------
// 11. PAYMENT
// ----------------------------------------------------
export interface PaymentAttributes {
  id: number;
  orderId: number;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  status: string; // 'Pending' | 'Completed' | 'Failed'
}
export class Payment extends Model<PaymentAttributes, Optional<PaymentAttributes, 'id' | 'status'>> implements PaymentAttributes {
  declare id: number;
  declare orderId: number;
  declare transactionId: string;
  declare paymentMethod: string;
  declare amount: number;
  declare status: string;
}
Payment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    transactionId: { type: DataTypes.STRING, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
  },
  { sequelize, modelName: 'Payment', tableName: 'payments', timestamps: true }
);

// ----------------------------------------------------
// 12. COUPON
// ----------------------------------------------------
export interface CouponAttributes {
  id: number;
  code: string;
  discountType: string; // 'Percentage' | 'Fixed'
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: Date;
  active: boolean;
}
export class Coupon extends Model<CouponAttributes, Optional<CouponAttributes, 'id' | 'maxDiscount' | 'active'>> implements CouponAttributes {
  declare id: number;
  declare code: string;
  declare discountType: string;
  declare discountValue: number;
  declare minOrderValue: number;
  declare maxDiscount?: number;
  declare expiryDate: Date;
  declare active: boolean;
}
Coupon.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    discountType: { type: DataTypes.STRING, defaultValue: 'Percentage' },
    discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    minOrderValue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    maxDiscount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    expiryDate: { type: DataTypes.DATE, allowNull: false },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: 'Coupon', tableName: 'coupons', timestamps: true }
);

// ----------------------------------------------------
// 13. REVIEW
// ----------------------------------------------------
export interface ReviewAttributes {
  id: number;
  userId: number;
  medicineId: number;
  rating: number;
  comment?: string;
}
export class Review extends Model<ReviewAttributes, Optional<ReviewAttributes, 'id' | 'comment'>> implements ReviewAttributes {
  declare id: number;
  declare userId: number;
  declare medicineId: number;
  declare rating: number;
  declare comment?: string;
}
Review.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    medicineId: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Review', tableName: 'reviews', timestamps: true }
);

// ----------------------------------------------------
// 14. BLOG
// ----------------------------------------------------
export interface BlogAttributes {
  id: number;
  title: string;
  slug: string;
  content: string;
  authorId: number;
  category: string;
  tags?: string; // comma-separated
  readTime: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}
export class Blog extends Model<BlogAttributes, Optional<BlogAttributes, 'id' | 'tags' | 'coverImage' | 'seoTitle' | 'seoDescription'>> implements BlogAttributes {
  declare id: number;
  declare title: string;
  declare slug: string;
  declare content: string;
  declare authorId: number;
  declare category: string;
  declare tags?: string;
  declare readTime: string;
  declare coverImage?: string;
  declare seoTitle?: string;
  declare seoDescription?: string;
}
Blog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    tags: { type: DataTypes.STRING, allowNull: true },
    readTime: { type: DataTypes.STRING, defaultValue: '5 mins' },
    coverImage: { type: DataTypes.STRING, allowNull: true },
    seoTitle: { type: DataTypes.STRING, allowNull: true },
    seoDescription: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Blog', tableName: 'blogs', timestamps: true }
);

// ----------------------------------------------------
// 15. DOCTOR
// ----------------------------------------------------
export interface DoctorAttributes {
  id: number;
  name: string;
  specialization: string;
  experience: number; // in years
  fees: number;
  availability: string; // JSON representation of slots
  avatar?: string;
  rating: number;
}
export class Doctor extends Model<DoctorAttributes, Optional<DoctorAttributes, 'id' | 'avatar' | 'rating'>> implements DoctorAttributes {
  declare id: number;
  declare name: string;
  declare specialization: string;
  declare experience: number;
  declare fees: number;
  declare availability: string;
  declare avatar?: string;
  declare rating: number;
}
Doctor.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    specialization: { type: DataTypes.STRING, allowNull: false },
    experience: { type: DataTypes.INTEGER, allowNull: false },
    fees: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    availability: { type: DataTypes.TEXT, defaultValue: '[]' },
    avatar: { type: DataTypes.STRING, allowNull: true },
    rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 5.0 },
  },
  { sequelize, modelName: 'Doctor', tableName: 'doctors', timestamps: true }
);

// ----------------------------------------------------
// 16. APPOINTMENT
// ----------------------------------------------------
export interface AppointmentAttributes {
  id: number;
  userId: number;
  doctorId: number;
  dateTime: Date;
  type: string; // 'Video' | 'Chat'
  status: string; // 'Scheduled' | 'Completed' | 'Cancelled'
  notes?: string;
}
export class Appointment extends Model<AppointmentAttributes, Optional<AppointmentAttributes, 'id' | 'type' | 'status' | 'notes'>> implements AppointmentAttributes {
  declare id: number;
  declare userId: number;
  declare doctorId: number;
  declare dateTime: Date;
  declare type: string;
  declare status: string;
  declare notes?: string;
}
Appointment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    dateTime: { type: DataTypes.DATE, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'Video' },
    status: { type: DataTypes.STRING, defaultValue: 'Scheduled' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Appointment', tableName: 'appointments', timestamps: true }
);

// ----------------------------------------------------
// 17. NOTIFICATION
// ----------------------------------------------------
export interface NotificationAttributes {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
}
export class Notification extends Model<NotificationAttributes, Optional<NotificationAttributes, 'id' | 'read'>> implements NotificationAttributes {
  declare id: number;
  declare userId: number;
  declare title: string;
  declare message: string;
  declare read: boolean;
}
Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Notification', tableName: 'notifications', timestamps: true }
);

// ----------------------------------------------------
// 18. SETTING
// ----------------------------------------------------
export interface SettingAttributes {
  id: number;
  key: string;
  value: string;
}
export class Setting extends Model<SettingAttributes, Optional<SettingAttributes, 'id'>> implements SettingAttributes {
  declare id: number;
  declare key: string;
  declare value: string;
}
Setting.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, modelName: 'Setting', tableName: 'settings', timestamps: false }
);

// ----------------------------------------------------
// 19. PAGEMETA (SEO)
// ----------------------------------------------------
export interface PageMetaAttributes {
  id: number;
  routePath: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}
export class PageMeta extends Model<PageMetaAttributes, Optional<PageMetaAttributes, 'id' | 'ogTitle' | 'ogDescription' | 'ogImage'>> implements PageMetaAttributes {
  declare id: number;
  declare routePath: string;
  declare title: string;
  declare description: string;
  declare keywords: string;
  declare ogTitle?: string;
  declare ogDescription?: string;
  declare ogImage?: string;
}
PageMeta.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    routePath: { type: DataTypes.STRING, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    keywords: { type: DataTypes.TEXT, allowNull: false },
    ogTitle: { type: DataTypes.STRING, allowNull: true },
    ogDescription: { type: DataTypes.TEXT, allowNull: true },
    ogImage: { type: DataTypes.STRING, allowNull: true },
  },
  { sequelize, modelName: 'PageMeta', tableName: 'page_meta', timestamps: true }
);

// ----------------------------------------------------
// 20. BANNER
// ----------------------------------------------------
export interface BannerAttributes {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  type: string; // 'Hero' | 'Promo'
  active: boolean;
}
export class Banner extends Model<BannerAttributes, Optional<BannerAttributes, 'id' | 'subtitle' | 'active'>> implements BannerAttributes {
  declare id: number;
  declare title: string;
  declare subtitle?: string;
  declare image: string;
  declare link: string;
  declare type: string;
  declare active: boolean;
}
Banner.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    subtitle: { type: DataTypes.STRING, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: false },
    link: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'Hero' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: 'Banner', tableName: 'banners', timestamps: true }
);

// ====================================================
// RELATIONSHIPS & ASSOCIATIONS
// ====================================================

// Role & User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// User & Address
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Category & Medicine
Category.hasMany(Medicine, { foreignKey: 'categoryId', as: 'medicines' });
Medicine.belongsTo(Category, { foreignKey: 'category', as: 'categoryDetail' });

// Brand & Medicine
Brand.hasMany(Medicine, { foreignKey: 'brandId', as: 'medicines' });
Medicine.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });

// Medicine & Inventory
Medicine.hasOne(Inventory, { foreignKey: 'medicineId', as: 'inventory' });
Inventory.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

// User & Prescription
User.hasMany(Prescription, { foreignKey: 'userId', as: 'prescriptions' });
Prescription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Pharmacist/Admin (User) & Prescription (Verification)
User.hasMany(Prescription, { foreignKey: 'verifiedById', as: 'verifiedPrescriptions' });
Prescription.belongsTo(User, { foreignKey: 'verifiedById', as: 'verifier' });

// User & Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Prescription & Order
Prescription.hasMany(Order, { foreignKey: 'prescriptionId', as: 'orders' });
Order.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

// Address & Order
Address.hasMany(Order, { foreignKey: 'shippingAddressId', as: 'orders' });
Order.belongsTo(Address, { foreignKey: 'shippingAddressId', as: 'shippingAddress' });

// Coupon & Order
Coupon.hasMany(Order, { foreignKey: 'couponId', as: 'orders' });
Order.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

// Order & OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Medicine & OrderItem
Medicine.hasMany(OrderItem, { foreignKey: 'medicineId', as: 'orderItems' });
OrderItem.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

// Order & Payment
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// User & Review
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Medicine & Review
Medicine.hasMany(Review, { foreignKey: 'medicineId', as: 'reviews' });
Review.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });

// User & Blog
User.hasMany(Blog, { foreignKey: 'authorId', as: 'blogs' });
Blog.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// User & Appointment
User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
Appointment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Doctor & Appointment
Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// User & Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default {
  Role,
  User,
  Address,
  Category,
  Brand,
  Medicine,
  Inventory,
  Prescription,
  Order,
  OrderItem,
  Payment,
  Coupon,
  Review,
  Blog,
  Doctor,
  Appointment,
  Notification,
  Setting,
  Banner,
  PageMeta,
};
