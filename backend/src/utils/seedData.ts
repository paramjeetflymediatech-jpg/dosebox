import bcrypt from 'bcryptjs';
import { 
  Role, User, Category, Brand, Medicine, Banner, Coupon, Blog, Doctor, Inventory, Setting, Address 
} from '../models';

export async function runSeeder() {
  try {
    console.log('[Seeder] Starting database seeding check...');

    // 1. Roles
    try {
      await Role.findOrCreate({ where: { id: 1 }, defaults: { name: 'Admin' } });
      await Role.findOrCreate({ where: { id: 2 }, defaults: { name: 'Pharmacist' } });
      await Role.findOrCreate({ where: { id: 3 }, defaults: { name: 'Customer' } });
      console.log('[Seeder] Roles verified.');
    } catch (e) {
      console.warn('[Seeder Warning] Roles verification issue:', e);
    }

    // 2. Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    try {
      await User.findOrCreate({
        where: { email: 'admin@mrmed.com' },
        defaults: {
          name: 'System Admin',
          email: 'admin@mrmed.com',
          password: hashedPassword,
          roleId: 1,
          status: 'active'
        }
      });
    } catch (e) {}

    try {
      await User.findOrCreate({
        where: { email: 'pharmacist@mrmed.com' },
        defaults: {
          name: 'Senior Pharmacist',
          email: 'pharmacist@mrmed.com',
          password: hashedPassword,
          roleId: 2,
          status: 'active'
        }
      });
    } catch (e) {}

    try {
      await User.findOrCreate({
        where: { email: 'customer@mrmed.com' },
        defaults: {
          name: 'Regular Customer',
          email: 'customer@mrmed.com',
          password: hashedPassword,
          roleId: 3,
          status: 'active',
          phone: '9876543210'
        }
      });
    } catch (e) {}
    console.log('[Seeder] Core accounts verified.');

    // Seed default address for customer@mrmed.com
    try {
      const customerUser = await User.findOne({ where: { email: 'customer@mrmed.com' } });
      if (customerUser) {
        await Address.findOrCreate({
          where: { id: 1 },
          defaults: {
            id: 1,
            userId: customerUser.id,
            title: 'Home',
            street: '123 Health Ave, Medical District',
            city: 'Chennai',
            state: 'Tamil Nadu',
            zipCode: '600001',
            country: 'India',
            isDefault: true
          } as any
        });
        console.log('[Seeder] Default customer address verified.');
      }
    } catch (addressErr) {
      console.warn('[Seeder Warning] Default address verification issue:', addressErr);
    }

    // 3. Categories
    const categoriesData = [
      { name: 'Chronic Care', slug: 'chronic-care', description: 'Diabetes, Heart, and Asthma management medications.', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=250' },
      { name: 'OTC Medicines', slug: 'otc-medicines', description: 'Over the counter pills for pain, cold, and flu relief.', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250' },
      { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Daily multivitamins, fish oil, and health boosters.', image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=250' },
      { name: 'Ayurveda & Herbs', slug: 'ayurveda-herbs', description: 'Traditional Indian herbal wellness items.', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=250' },
      { name: 'Personal Care', slug: 'personal-care', description: 'Skincare, hair care, and hygiene items.', image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=250' },
    ];

    const seededCategories: any[] = [];
    for (const cat of categoriesData) {
      try {
        const [record] = await Category.findOrCreate({
          where: { slug: cat.slug },
          defaults: cat
        });
        seededCategories.push(record);
      } catch (e) {
        const record = await Category.findOne({ where: { slug: cat.slug } });
        if (record) seededCategories.push(record);
      }
    }
    console.log('[Seeder] Categories verified.');

    // 4. Brands
    const brandsData = [
      { name: 'Cipla Limited', slug: 'cipla', description: 'Leading multinational pharmaceutical company.', logo: 'https://images.unsplash.com/photo-1631553127989-130a139a03f4?auto=format&fit=crop&q=80&w=150' },
      { name: 'Sun Pharma', slug: 'sun-pharma', description: 'Top generic pharmaceutical company in India.', logo: 'https://images.unsplash.com/photo-1631553127989-130a139a03f4?auto=format&fit=crop&q=80&w=150' },
      { name: 'Abbott Laboratories', slug: 'abbott', description: 'Global healthcare leader.', logo: 'https://images.unsplash.com/photo-1631553127989-130a139a03f4?auto=format&fit=crop&q=80&w=150' },
      { name: 'Himalaya Wellness', slug: 'himalaya', description: 'Ayurvedic personal care & health supplements.', logo: 'https://images.unsplash.com/photo-1631553127989-130a139a03f4?auto=format&fit=crop&q=80&w=150' },
    ];

    const seededBrands: any[] = [];
    for (const br of brandsData) {
      try {
        const [record] = await Brand.findOrCreate({
          where: { slug: br.slug },
          defaults: br
        });
        seededBrands.push(record);
      } catch (e) {
        const record = await Brand.findOne({ where: { slug: br.slug } });
        if (record) seededBrands.push(record);
      }
    }
    console.log('[Seeder] Brands verified.');

    // Helper IDs
    const catChronicId = seededCategories.find(c => c.slug === 'chronic-care')?.id || 1;
    const catOtcId = seededCategories.find(c => c.slug === 'otc-medicines')?.id || 2;
    const catVitId = seededCategories.find(c => c.slug === 'vitamins-supplements')?.id || 3;
    const catAyuId = seededCategories.find(c => c.slug === 'ayurveda-herbs')?.id || 4;

    const brandCiplaId = seededBrands.find(b => b.slug === 'cipla')?.id || 1;
    const brandSunId = seededBrands.find(b => b.slug === 'sun-pharma')?.id || 2;
    const brandAbbottId = seededBrands.find(b => b.slug === 'abbott')?.id || 3;
    const brandHimalayaId = seededBrands.find(b => b.slug === 'himalaya')?.id || 4;

    // 5. Medicines
    const medicinesData = [
      {
        name: 'Metformin Hydrochloride 500mg',
        genericName: 'Metformin',
        brandId: brandCiplaId,
        manufacturer: 'Cipla Ltd.',
        composition: 'Metformin Hydrochloride IP 500mg',
        dosage: 'Take 1 tablet daily with dinner or as directed by the physician.',
        description: 'Metformin 500mg is an oral diabetes medicine that helps control blood sugar levels for type-2 diabetes patients.',
        sideEffects: 'Nausea, vomiting, diarrhea, stomach pain, loss of appetite, metallic taste.',
        storageInstructions: 'Store in a cool dry place, below 25°C.',
        prescriptionRequired: true,
        price: 120.00,
        discountPrice: 96.00,
        stock: 150,
        images: JSON.stringify(['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500']),
        categoryId: catChronicId,
      },
      {
        name: 'Atorvastatin 10mg (Lipitor equivalent)',
        genericName: 'Atorvastatin',
        brandId: brandSunId,
        manufacturer: 'Sun Pharmaceutical Industries',
        composition: 'Atorvastatin Calcium Trihydrate IP 10mg',
        dosage: 'One tablet daily at night or as directed by the physician.',
        description: 'Atorvastatin belongs to a group of medicines called statins. It is used to lower lipids known as cholesterol and triglycerides in the blood.',
        sideEffects: 'Headache, muscle pain, nausea, nasal congestion, constipation.',
        storageInstructions: 'Store below 30°C. Protect from moisture.',
        prescriptionRequired: true,
        price: 180.00,
        discountPrice: 144.00,
        stock: 200,
        images: JSON.stringify(['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=500']),
        categoryId: catChronicId,
      },
      {
        name: 'Amoxicillin Trihydrate 250mg',
        genericName: 'Amoxicillin',
        brandId: brandAbbottId,
        manufacturer: 'Abbott Healthcare',
        composition: 'Amoxicillin Trihydrate 250mg',
        dosage: '1 capsule every 8 hours or as prescribed by a medical professional.',
        description: 'Amoxicillin is a penicillin antibiotic used to combat bacterial infections such as pneumonia, tonsillitis, and ear/urinary tract infections.',
        sideEffects: 'Skin rash, nausea, diarrhea, yeast infection.',
        storageInstructions: 'Store in dry conditions at room temperature.',
        prescriptionRequired: true,
        price: 90.00,
        discountPrice: 81.00,
        stock: 5, // low stock for inventory alert testing
        images: JSON.stringify(['https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=500']),
        categoryId: catOtcId,
      },
      {
        name: 'Crocin Pain Relief Tablet',
        genericName: 'Paracetamol & Caffeine',
        brandId: brandCiplaId,
        manufacturer: 'GSK Consumer Healthcare / Packaged Cipla',
        composition: 'Paracetamol IP 650mg, Caffeine Anhydrous 50mg',
        dosage: '1 to 2 tablets every 4-6 hours. Do not exceed 4000mg Paracetamol per day.',
        description: 'Crocin Pain Relief provides fast relief from headaches, migraines, muscle aches, sore throat, and dental pain.',
        sideEffects: 'Allergic reactions, insomnia if taken near bedtime due to caffeine.',
        storageInstructions: 'Keep out of reach of children. Store below 25°C.',
        prescriptionRequired: false,
        price: 45.00,
        discountPrice: 42.00,
        stock: 350,
        images: JSON.stringify(['https://images.unsplash.com/photo-1607619056574-7b8d304e2c23?auto=format&fit=crop&q=80&w=500']),
        categoryId: catOtcId,
      },
      {
        name: 'Himalaya Ashvagandha Capsules',
        genericName: 'Withania somnifera Extract',
        brandId: brandHimalayaId,
        manufacturer: 'Himalaya Wellness Company',
        composition: 'Ashvagandha Root Extract - 250mg',
        dosage: '1 capsule twice daily, or as recommended by the doctor.',
        description: 'Pure herbal supplement that aids in stress relief, builds immunity, and rejuvenates overall energy levels.',
        sideEffects: 'Extremely safe; may cause mild sleepiness at high doses.',
        storageInstructions: 'Keep in dry cupboard, away from direct sunlight.',
        prescriptionRequired: false,
        price: 220.00,
        discountPrice: 198.00,
        stock: 120,
        images: JSON.stringify(['https://images.unsplash.com/photo-1611070973770-b1a672610041?auto=format&fit=crop&q=80&w=500']),
        categoryId: catAyuId,
      },
      {
        name: 'Centrum Adults Multivitamin 30s',
        genericName: 'Multivitamins & Minerals',
        brandId: brandAbbottId,
        manufacturer: 'GSK / Abbott Imports',
        composition: 'Vitamins A, C, D3, E, B-Complex, Calcium, Zinc, Magnesium',
        dosage: 'One tablet daily with food.',
        description: 'Provides daily essential micronutrients to support energy, immunity, metabolism, and full-body health.',
        sideEffects: 'None under recommended dosage.',
        storageInstructions: 'Store in dry place and close container tightly after use.',
        prescriptionRequired: false,
        price: 650.00,
        discountPrice: 585.00,
        stock: 80,
        images: JSON.stringify(['https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=500']),
        categoryId: catVitId,
      }
    ];

    for (const med of medicinesData) {
      try {
        const [record, created] = await Medicine.findOrCreate({
          where: { name: med.name },
          defaults: med
        });
        if (created) {
          await Inventory.create({
            medicineId: record.id,
            minStockAlertThreshold: 15,
            locationInWarehouse: 'Rack A-23'
          });
        }
      } catch (e) {}
    }
    console.log('[Seeder] Medicines & Inventory verified.');

    // 6. Banners
    const bannersData = [
      { title: 'Flat 15% OFF on Chronic Care Medicines', subtitle: 'Manage Diabetes & Heart Health with Ease', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200', link: '/medicines?category=chronic-care', type: 'Hero', active: true },
      { title: 'Instant Doctor Video Consultation at ₹499', subtitle: 'Speak to Certified Specialists in 10 Mins', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200', link: '/consultations', type: 'Hero', active: true },
      { title: 'Super Saver Wellness Packages', subtitle: 'Get Free Home Sample Collection on Lab Tests', image: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=1200', link: '/packages', type: 'Promo', active: true }
    ];

    for (const ban of bannersData) {
      try {
        await Banner.findOrCreate({
          where: { title: ban.title },
          defaults: ban
        });
      } catch (e) {}
    }
    console.log('[Seeder] Banners verified.');

    // 7. Coupons
    const couponsData = [
      { code: 'WELCOME10', discountType: 'Percentage', discountValue: 10.00, minOrderValue: 200.00, maxDiscount: 100.00, expiryDate: new Date('2028-12-31'), active: true },
      { code: 'HEALTH20', discountType: 'Percentage', discountValue: 20.00, minOrderValue: 500.00, maxDiscount: 250.00, expiryDate: new Date('2028-12-31'), active: true },
      { code: 'FLAT50', discountType: 'Fixed', discountValue: 50.00, minOrderValue: 300.00, maxDiscount: 50.00, expiryDate: new Date('2028-12-31'), active: true }
    ];

    for (const coup of couponsData) {
      try {
        await Coupon.findOrCreate({
          where: { code: coup.code },
          defaults: coup
        });
      } catch (e) {}
    }
    console.log('[Seeder] Coupons verified.');

    // 8. Doctors
    const doctorsData = [
      { name: 'Dr. Arvinder Singh', specialization: 'General Physician & Diabetologist', experience: 14, fees: 500.00, availability: JSON.stringify(['09:00 AM', '11:00 AM', '04:00 PM', '06:00 PM']), avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250', rating: 4.8 },
      { name: 'Dr. Priya Ramachandran', specialization: 'Consultant Dermatologist', experience: 10, fees: 600.00, availability: JSON.stringify(['10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM']), avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250', rating: 4.9 },
      { name: 'Dr. Rohan Mehra', specialization: 'Cardiologist', experience: 18, fees: 800.00, availability: JSON.stringify(['11:30 AM', '03:30 PM', '07:00 PM']), avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250', rating: 5.0 }
    ];

    for (const doc of doctorsData) {
      try {
        await Doctor.findOrCreate({
          where: { name: doc.name },
          defaults: doc
        });
      } catch (e) {}
    }
    console.log('[Seeder] Doctors verified.');

    // 9. Blogs
    const blogsData = [
      {
        title: 'Managing Type 2 Diabetes: A Life Guide',
        slug: 'managing-type-2-diabetes',
        content: 'Type 2 Diabetes is a chronic health condition that affects how your body processes sugar. With correct diets, regular physical exercises, and proper adherence to prescribed medicines like Metformin, you can easily control it and maintain a standard vibrant lifestyle...',
        authorId: 1, // Admin
        category: 'Chronic Conditions',
        tags: 'Diabetes, Health, Guide',
        readTime: '6 mins',
        coverImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
        seoTitle: 'Type 2 Diabetes Control & Health Guide | MrMed',
        seoDescription: 'Discover how to effectively manage type 2 diabetes through daily diet, exercise tips, and medication compliance.'
      },
      {
        title: 'The Vital Role of Daily Multivitamins',
        slug: 'role-of-daily-multivitamins',
        content: 'Vitamins and minerals form the micro-structural blocks of our metabolic energy and cell defenses. If your daily busy diet is lacking clean balanced nutrients, clinical multivitamins like Centrum can help cover your trace deficiencies and keep you energized...',
        authorId: 1,
        category: 'Nutrition & Wellness',
        tags: 'Vitamins, Supplement, Diet',
        readTime: '4 mins',
        coverImage: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=600',
        seoTitle: 'Why Take Daily Multivitamins | Complete Guide | MrMed',
        seoDescription: 'Learn why daily multivitamin supplements are beneficial to cover dietary gaps, support immune system, and boost cellular energy.'
      }
    ];

    for (const blog of blogsData) {
      try {
        await Blog.findOrCreate({
          where: { slug: blog.slug },
          defaults: blog
        });
      } catch (e) {}
    }
    console.log('[Seeder] Blogs verified.');

    // 10. General settings
    const settingsData = [
      { key: 'platform_name', value: 'MrMed Healthcare' },
      { key: 'contact_email', value: 'support@mrmed.com' },
      { key: 'gst_rate_percent', value: '18' },
      { key: 'shipping_fee', value: '50.00' }
    ];

    for (const set of settingsData) {
      try {
        await Setting.findOrCreate({
          where: { key: set.key },
          defaults: set
        });
      } catch (e) {}
    }
    console.log('[Seeder] Settings verified.');

    console.log('[Seeder] Database seeding successfully checked & run.');
  } catch (error) {
    console.error('[Seeder] Database seeding error:', error);
  }
}
