export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Category, Brand, Supplier } from '@/models';
import sequelize from '@/config/database';

export async function GET() {
  try {
    // Seed Categories
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

    // Seed Brands
    const brands = [
      { id: 1, name: 'PharmaCorp', slug: 'pharmacorp', logo: '[]' },
      { id: 2, name: 'MedPlus', slug: 'medplus', logo: '[]' },
      { id: 3, name: 'HealthCare Inc', slug: 'healthcare-inc', logo: '[]' }
    ];
    for (const b of brands) {
      await Brand.findOrCreate({ where: { id: b.id }, defaults: b });
    }

    // Seed Suppliers
    const suppliers = [
      { id: 1, name: 'HealthCorp Supplies', email: 'healthcorp@example.com', phone: '1234567890' },
      { id: 2, name: 'MedLife Distributors', email: 'medlife@example.com', phone: '0987654321' }
    ];
    for (const s of suppliers) {
      await Supplier.findOrCreate({ where: { id: s.id }, defaults: s });
    }

    return NextResponse.json({ success: true, message: 'Seeded dependencies successfully!' });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
