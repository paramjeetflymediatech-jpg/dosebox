import sequelize from './src/config/database';
import { Category, Brand, Supplier, Role, User } from './src/models';
import bcrypt from 'bcryptjs';

async function seedDB() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Seeding Roles...');
    const roles = [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
      { id: 3, name: 'Delivery' }
    ];
    for (const r of roles) {
      await Role.findOrCreate({ where: { id: r.id }, defaults: r });
    }

    console.log('Seeding Admin User...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.findOrCreate({
      where: { email: 'admin@mrmed.com' },
      defaults: {
        name: 'Super Admin',
        email: 'admin@mrmed.com',
        password: adminPassword,
        roleId: 1, // Admin
        status: 'active'
      }
    });

    console.log('Seeding Categories...');
    const categories = [
      { id: 1, name: 'Pain Relief', slug: 'pain-relief', image: '[]' },
      { id: 2, name: 'Antibiotics', slug: 'antibiotics', image: '[]' },
      { id: 3, name: 'Cough & Cold', slug: 'cough-cold', image: '[]' },
      { id: 4, name: 'Diabetes', slug: 'diabetes', image: '[]' },
      { id: 5, name: 'Digestion', slug: 'digestion', image: '[]' },
      { id: 6, name: 'Vitamins', slug: 'vitamins', image: '[]' },
      { id: 7, name: 'First Aid', slug: 'first-aid', image: '[]' }
    ];
    for (const c of categories) {
      await Category.findOrCreate({ where: { id: c.id }, defaults: c });
    }

    console.log('Seeding Brands...');
    const brands = [
      { id: 1, name: 'PharmaCorp', slug: 'pharmacorp', logo: '[]' },
      { id: 2, name: 'MedPlus', slug: 'medplus', logo: '[]' },
      { id: 3, name: 'HealthCare Inc', slug: 'healthcare-inc', logo: '[]' }
    ];
    for (const b of brands) {
      await Brand.findOrCreate({ where: { id: b.id }, defaults: b });
    }

    console.log('Seeding Suppliers...');
    const suppliers = [
      { id: 1, name: 'HealthCorp Supplies', email: 'healthcorp@example.com', phone: '1234567890' },
      { id: 2, name: 'MedLife Distributors', email: 'medlife@example.com', phone: '0987654321' }
    ];
    for (const s of suppliers) {
      await Supplier.findOrCreate({ where: { id: s.id }, defaults: s });
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDB();
