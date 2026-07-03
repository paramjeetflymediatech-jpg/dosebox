export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Category, Brand, Supplier, Role, User, Medicine } from '@/models';
import sequelize from '@/config/database';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import path from 'path';

export async function GET() {
  try {
    console.log('Starting seed via Next.js API...');

    // 1. Seed Roles
    const roles = [
      { id: 1, name: 'SuperAdmin' },
      { id: 2, name: 'Admin' },
      { id: 3, name: 'Pharmacist' },
      { id: 4, name: 'Customer' },
    ];
    for (const r of roles) {
      await Role.findOrCreate({ where: { id: r.id }, defaults: r });
    }

    // 2. Seed Admin User
    const existingAdmin = await User.findOne({ where: { email: 'admin@dosebox.com' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@dosebox.com',
        phone: '1234567890',
        password: hashedPassword,
        roleId: 1, // SuperAdmin
        status: 'active'
      });
    }

    // 3. Seed Categories
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

    // 4. Seed Brands
    const brands = [
      { id: 1, name: 'PharmaCorp', slug: 'pharmacorp', logo: '[]' },
      { id: 2, name: 'MedPlus', slug: 'medplus', logo: '[]' },
      { id: 3, name: 'HealthCare Inc', slug: 'healthcare-inc', logo: '[]' }
    ];
    for (const b of brands) {
      await Brand.findOrCreate({ where: { id: b.id }, defaults: b });
    }

    // 5. Seed Suppliers
    const suppliers = [
      { id: 1, name: 'HealthCorp Supplies', email: 'healthcorp@example.com', phone: '1234567890' },
      { id: 2, name: 'MedLife Distributors', email: 'medlife@example.com', phone: '0987654321' }
    ];
    for (const s of suppliers) {
      await Supplier.findOrCreate({ where: { id: s.id }, defaults: s });
    }

    // 6. Seed Medicines from CSV
    const csvPath = path.join(process.cwd(), 'medicines_sample.csv');
    const workbook = xlsx.readFile(csvPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const medicinesData = xlsx.utils.sheet_to_json(sheet) as any[];

    for (const med of medicinesData) {
      await Medicine.findOrCreate({
        where: { name: med.name },
        defaults: {
          ...med,
          description: med.description || 'Quality medicine for your well-being.',
          images: med.images ? med.images : '[]',
          prescriptionRequired: false
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Database seeded perfectly via API!' });
  } catch (error: any) {
    console.error('Error seeding data via API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
