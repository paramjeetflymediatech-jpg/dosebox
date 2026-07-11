require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'dosebox'
  });

  console.log('Connected successfully!');

  try {
    // 1. Roles
    console.log('Seeding Roles...');
    // const roles = [
    //   [1, 'SuperAdmin'], [2, 'Admin'], [3, 'Pharmacist'], [4, 'Customer']
    // ];
    // for (const [id, name] of roles) {
    //   await connection.execute(
    //     'INSERT IGNORE INTO roles (id, name, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
    //     [id, name]
    //   );
    // }

    // // 2. Admin User
    // console.log('Seeding Admin User...');
    // const [adminRows] = await connection.execute('SELECT id FROM users WHERE email = ?', ['admin@dosebox.com']);
    // if (adminRows.length === 0) {
    //   const hash = await bcrypt.hash('admin123', 10);
    //   await connection.execute(
    //     'INSERT INTO users (name, email, phone, password, roleId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    //     ['System Admin', 'admin@dosebox.com', '1234567890', hash, 1, 'active']
    //   );
    // }

    // // 3. Categories
    // console.log('Seeding Categories...');
    // const categories = [
    //   [1, 'Pain Relief', 'pain-relief', '[]'],
    //   [2, 'Antibiotics', 'antibiotics', '[]'],
    //   [3, 'Cough & Cold', 'cough-cold', '[]'],
    //   [4, 'Diabetes', 'diabetes', '[]'],
    //   [5, 'Digestion', 'digestion', '[]'],
    //   [6, 'Vitamins', 'vitamins', '[]'],
    //   [7, 'First Aid', 'first-aid', '[]']
    // ];
    // for (const [id, name, slug, image] of categories) {
    //   await connection.execute(
    //     'INSERT IGNORE INTO categories (id, name, slug, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    //     [id, name, slug, image]
    //   );
    // }

    // // 4. Brands
    // console.log('Seeding Brands...');
    // const brands = [
    //   [1, 'PharmaCorp', 'pharmacorp', '[]'],
    //   [2, 'MedPlus', 'medplus', '[]'],
    //   [3, 'HealthCare Inc', 'healthcare-inc', '[]']
    // ];
    // for (const [id, name, slug, logo] of brands) {
    //   await connection.execute(
    //     'INSERT IGNORE INTO brands (id, name, slug, logo, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    //     [id, name, slug, logo]
    //   );
    // }

    // // 5. Suppliers
    // console.log('Seeding Suppliers...');
    // const suppliers = [
    //   [1, 'HealthCorp Supplies', 'healthcorp@example.com', '1234567890'],
    //   [2, 'MedLife Distributors', 'medlife@example.com', '0987654321']
    // ];
    // for (const [id, name, email, phone] of suppliers) {
    //   await connection.execute(
    //     'INSERT IGNORE INTO suppliers (id, name, email, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
    //     [id, name, email, phone]
    //   );
    // }

    // 6. Medicines
    console.log('Seeding Medicines from CSV...');
    const csvPath = path.join(process.cwd(), 'medicines_sample.csv');
    if (fs.existsSync(csvPath)) {
      const workbook = xlsx.readFile(csvPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const medicinesData = xlsx.utils.sheet_to_json(sheet);

      for (const med of medicinesData) {
        // Find if exists
        const [existing] = await connection.execute('SELECT id FROM medicines WHERE name = ?', [med.name]);
        if (existing.length === 0) {
          await connection.execute(
            `INSERT INTO medicines 
            (name, genericName, price, stock, categoryId, brandId, supplierId, images, description, prescriptionRequired, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              med.name,
              med.genericName || null,
              med.price || 0,
              med.stock || 0,
              med.categoryId || null,
              med.brandId || null,
              med.supplierId || null,
              med.images || '[]',
              med.description || 'Quality medicine for your well-being.',
              med.prescriptionRequired ? 1 : 0
            ]
          );
        }
      }
    } else {
      console.log('medicines_sample.csv not found, skipping medicines.');
    }

    console.log('Database seeded successfully via raw SQL!');
  } catch (error) {
    console.error('Seed Error:', error);
  } finally {
    await connection.end();
  }
}

seed();
