const mysql = require('mysql2/promise');

async function approveLatest() {
  try {
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'root', database: 'mrmed_db' });
    
    const [prescriptions] = await conn.execute('SELECT id, userId FROM prescriptions WHERE status = "Pending" ORDER BY createdAt DESC LIMIT 1');
    if (prescriptions.length === 0) {
      console.log('No pending prescriptions found.');
      process.exit(0);
    }
    const rx = prescriptions[0];
    console.log('Found Pending Prescription:', rx.id, 'for User:', rx.userId);
    
    const [medicines] = await conn.execute('SELECT id, price FROM medicines LIMIT 1');
    const med = medicines[0];
    
    await conn.execute('INSERT INTO draft_carts (userId, prescriptionId, status, createdAt, updatedAt) VALUES (?, ?, "approved", NOW(), NOW())', [rx.userId, rx.id]);
    
    const [drafts] = await conn.execute('SELECT id FROM draft_carts WHERE prescriptionId = ? ORDER BY id DESC LIMIT 1', [rx.id]);
    const draftId = drafts[0].id;
    
    await conn.execute('INSERT INTO draft_cart_items (draftCartId, medicineId, quantity, price, type, createdAt, updatedAt) VALUES (?, ?, 1, ?, "exact", NOW(), NOW())', [draftId, med.id, med.price]);
    
    await conn.execute('UPDATE prescriptions SET status = "Approved" WHERE id = ?', [rx.id]);
    
    console.log('Successfully approved prescription ' + rx.id + ' and created draft cart.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
approveLatest();
