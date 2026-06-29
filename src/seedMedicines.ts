import { Sequelize } from 'sequelize';
import sequelize from './config/database';
import { Category, Brand, Medicine, Inventory } from './models';

async function seed() {
  try {
    await sequelize.sync(); // ensure tables exist

    console.log('Seeding Categories...');
    const categories = [
      { id: 1, name: 'Chronic Care', slug: 'chronic-care' },
      { id: 2, name: 'OTC Medicines', slug: 'otc-medicines' },
      { id: 3, name: 'Vitamins & Supplements', slug: 'vitamins-supplements' },
      { id: 4, name: 'Ayurveda & Herbs', slug: 'ayurveda-herbs' },
    ];
    for (const cat of categories) {
      await Category.upsert(cat);
    }

    console.log('Seeding Brands...');
    const brands = [
      { id: 1, name: 'Cipla Ltd.', slug: 'cipla-ltd' },
      { id: 2, name: 'Sun Pharmaceutical Industries', slug: 'sun-pharma' },
      { id: 3, name: 'GSK Consumer Healthcare', slug: 'gsk' },
      { id: 4, name: 'Abbott Healthcare', slug: 'abbott' },
      { id: 5, name: 'Himalaya Wellness Company', slug: 'himalaya' },
    ];
    for (const b of brands) {
      await Brand.upsert(b);
    }

    console.log('Seeding Medicines...');
    const medicines = [
      {
        id: 1,
        name: 'Metformin Hydrochloride 500mg',
        genericName: 'Metformin',
        brandId: 1, // Cipla
        manufacturer: 'Cipla Ltd.',
        composition: 'Metformin Hydrochloride IP 500mg',
        dosage: 'Take 1 tablet daily with dinner or as directed by the physician.',
        prescriptionRequired: true,
        price: 120.00,
        discountPrice: 96.00,
        stock: 150,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250']),
        categoryId: 1
      },
      {
        id: 2,
        name: 'Atorvastatin 10mg (Lipitor equivalent)',
        genericName: 'Atorvastatin',
        brandId: 2, // Sun
        manufacturer: 'Sun Pharmaceutical Industries',
        composition: 'Atorvastatin Calcium Trihydrate IP 10mg',
        dosage: 'One tablet daily at night or as directed by the physician.',
        prescriptionRequired: true,
        price: 180.00,
        discountPrice: 144.00,
        stock: 200,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250']),
        categoryId: 1
      },
      {
        id: 3,
        name: 'Crocin Pain Relief Tablet',
        genericName: 'Paracetamol & Caffeine',
        brandId: 3, // GSK
        manufacturer: 'GSK Consumer Healthcare',
        composition: 'Paracetamol IP 650mg, Caffeine Anhydrous 50mg',
        dosage: '1 to 2 tablets every 4-6 hours.',
        prescriptionRequired: false,
        price: 45.00,
        discountPrice: 42.00,
        stock: 350,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250']),
        categoryId: 2
      },
      {
        id: 4,
        name: 'Centrum Adults Multivitamin 30s',
        genericName: 'Multivitamins & Minerals',
        brandId: 4, // Abbott
        manufacturer: 'Abbott Healthcare',
        composition: 'Vitamins A, C, D3, E, B-Complex, Calcium, Zinc, Magnesium',
        dosage: 'One tablet daily with food.',
        prescriptionRequired: false,
        price: 650.00,
        discountPrice: 585.00,
        stock: 80,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250']),
        categoryId: 3
      },
      {
        id: 5,
        name: 'Himalaya Ashvagandha Capsules',
        genericName: 'Withania somnifera Extract',
        brandId: 5, // Himalaya
        manufacturer: 'Himalaya Wellness Company',
        composition: 'Ashvagandha Root Extract - 250mg',
        dosage: '1 capsule twice daily, or as recommended by the doctor.',
        prescriptionRequired: false,
        price: 220.00,
        discountPrice: 198.00,
        stock: 120,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250']),
        categoryId: 4
      }
    ];

    for (const med of medicines) {
      await Medicine.upsert(med);
      await Inventory.upsert({
        id: med.id, // match medicine id
        medicineId: med.id,
        minStockAlertThreshold: 10,
        locationInWarehouse: 'Zone A'
      });
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
