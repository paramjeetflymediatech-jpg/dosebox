import sequelize from './src/config/database';
import { User, Role } from './src/models/index';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@dosebox.com';
  const password = args[1] || 'admin123';
  const name = args[2] || 'System Admin';

  console.log(`Attempting to create admin user: ${email}...`);

  try {
    // 1. Ensure SuperAdmin role exists (id: 1)
    await Role.findOrCreate({ 
      where: { id: 1 }, 
      defaults: { id: 1, name: 'SuperAdmin' } 
    });

    // 2. Check if user already exists
    const existingAdmin = await User.findOne({ where: { email } });
    
    if (existingAdmin) {
      console.log(`[Info] User with email ${email} already exists.`);
      process.exit(0);
    }

    // 3. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      name,
      email,
      phone: '1234567890',
      password: hashedPassword,
      roleId: 1, // SuperAdmin
      status: 'active'
    });

    console.log(`\n✅ Successfully created admin user!`);
    console.log(`ID: ${admin.id}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: SuperAdmin (roleId: 1)`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
