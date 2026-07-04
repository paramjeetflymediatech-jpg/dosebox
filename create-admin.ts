import sequelize from './src/config/database';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@dosebox.com';
  const password = args[1] || 'admin123';
  const name = args[2] || 'System Admin';

  console.log(`Attempting to create admin user: ${email}...`);

  try {
    // 1. Ensure SuperAdmin role exists (id: 1)
    const [roles] = await sequelize.query(`SELECT id FROM roles WHERE id = 1`) as any[];
    if (!roles || roles.length === 0) {
      await sequelize.query(`INSERT INTO roles (id, name) VALUES (1, 'SuperAdmin')`);
    }

    // 2. Check if user already exists
    const [existingUsers] = await sequelize.query(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      { replacements: { email } }
    ) as any[];
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`[Info] User with email ${email} already exists.`);
      process.exit(0);
    }

    // 3. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await sequelize.query(
      `INSERT INTO users (name, email, phone, password, roleId, status, createdAt, updatedAt) 
       VALUES (:name, :email, '1234567890', :password, 1, 'active', :now, :now)`,
      { replacements: { name, email, password: hashedPassword, now } }
    );

    console.log(`\n✅ Successfully created admin user!`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: SuperAdmin (roleId: 1)`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
}

createAdmin();
