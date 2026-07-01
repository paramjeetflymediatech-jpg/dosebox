import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const updateAdmin = async () => {
  try {
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'root', database: 'mrmed_db' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const [adminRows]: any = await conn.execute('SELECT id FROM users WHERE roleId = 1 LIMIT 1');
    if (adminRows.length > 0) {
      await conn.execute('UPDATE users SET email = "admin@dosebox.com", password = ? WHERE id = ?', [hashedPassword, adminRows[0].id]);
      console.log('Admin user updated. Email: admin@dosebox.com, Password: admin123');
    } else {
      await conn.execute('INSERT INTO users (name, email, password, roleId, status, createdAt, updatedAt) VALUES ("Admin", "admin@dosebox.com", ?, 1, "active", NOW(), NOW())', [hashedPassword]);
      console.log('Admin user created. Email: admin@dosebox.com, Password: admin123');
    }
    
    await conn.end();
  } catch (err) {
    console.error('Failed to update admin', err);
  }
};

updateAdmin();
