const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mrmed_db'
  });

  // 1. Check Roles
  const [roles] = await connection.execute('SELECT * FROM roles');
  console.log('Current roles:', roles);

  const neededRoles = ['SuperAdmin', 'Admin', 'Customer', 'Pharmacist', 'Medico', 'Leadership'];
  for (const roleName of neededRoles) {
    if (!roles.find(r => r.name === roleName)) {
      await connection.execute('INSERT INTO roles (name) VALUES (?)', [roleName]);
      console.log('Inserted role:', roleName);
    }
  }

  const [updatedRoles] = await connection.execute('SELECT * FROM roles');
  
  const users = [
    { name: 'Demo SuperAdmin', email: 'superadmin@dosebox.com', role: 'SuperAdmin' },
    { name: 'Demo Admin', email: 'admin@dosebox.com', role: 'Admin' },
    { name: 'Demo Leadership', email: 'leadership@dosebox.com', role: 'Leadership' },
    { name: 'Demo Medico', email: 'medico@dosebox.com', role: 'Medico' },
    { name: 'Demo Customer', email: 'customer@dosebox.com', role: 'Customer' },
  ];

  for (const u of users) {
    const roleId = updatedRoles.find(r => r.name === u.role)?.id;
    if (!roleId) continue;

    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [u.email]);
    if (existing.length === 0) {
      const hash = await bcrypt.hash('password123', 10);
      await connection.execute(
        'INSERT INTO users (name, email, phone, password, roleId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [u.name, u.email, '999999999' + roleId, hash, roleId, 'active']
      );
      console.log('Inserted user:', u.email);
    } else {
      console.log('User already exists:', u.email);
    }
  }

  process.exit();
}

main().catch(console.error);
