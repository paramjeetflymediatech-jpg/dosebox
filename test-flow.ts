import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const API_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforauth';

const testFlow = async () => {
  try {
    console.log('--- STARTING FLOW TEST ---');

    // Find valid users via raw DB connection to avoid module loader issues
    const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'root', database: 'mrmed_db' });
    
    const [allUsers]: any = await conn.execute('SELECT id, email, roleId, status FROM users');
    console.log('All Users:', allUsers);
    
    const [adminRows]: any = await conn.execute('SELECT id, email FROM users WHERE roleId = 1 LIMIT 1');
    let [customerRows]: any = await conn.execute('SELECT id, email FROM users WHERE roleId = 2 LIMIT 1');
    
    if (!customerRows || customerRows.length === 0) {
      await conn.execute('INSERT INTO users (name, email, password, roleId, status, createdAt, updatedAt) VALUES ("Test Customer", "customer@test.com", "password123", 2, "active", NOW(), NOW())');
      [customerRows] = await conn.execute('SELECT id, email FROM users WHERE roleId = 2 LIMIT 1');
    }
    
    await conn.end();

    const admin = adminRows[0];
    const customer = customerRows[0];

    if (!customer || !admin) {
      console.log('Need a customer and admin in DB. Currently found:', { admin, customer });
      return;
    }

    const adminToken = jwt.sign({ id: admin.id, email: admin.email, roleId: 1 }, JWT_SECRET, { expiresIn: '1h' });
    const customerToken = jwt.sign({ id: customer.id, email: customer.email, roleId: 2 }, JWT_SECRET, { expiresIn: '1h' });



    console.log('Tokens generated.');

    // 1. Get current reward points
    console.log('Fetching customer profile...');
    const profileRes = await fetch(`${API_URL}/account/profile`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const profileData = await profileRes.json();
    console.log('Initial Reward Points:', profileData.data?.rewardPoints || 0);

    // 2. Create Order via Online Payment (PhonePe)
    console.log('\nCreating an order for ~₹600 with PhonePe...');
    const orderPayload = {
      items: [{ medicineId: 3, quantity: 15 }], // Crocin, non-rx
      shippingAddress: {
        id: 1, title: 'Home', street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '123456', country: 'India'
      },
      paymentMethod: 'PhonePe',
      useRewardPoints: false
    };

    const orderRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });
    const orderData = await orderRes.json();
    
    if (!orderData.success) {
      console.error('Order creation failed:', orderData);
      return;
    }
    
    const orderId = orderData.data.id;
    console.log('Order created successfully! ID:', orderId, 'Total Amount:', orderData.data.finalAmount);
    
    console.log('\nAdmin: Marking order as Paid...');
    const markPaidRes = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentStatus: 'Paid' })
    });
    const markPaidData = await markPaidRes.json();
    console.log('Mark Paid Result:', markPaidData.success);

    // 3. Admin Cancels Order
    console.log('\nAdmin: Cancelling order...');
    const cancelRes = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    const cancelData = await cancelRes.json();
    console.log('Cancel Result:', cancelData.success);

    // 4. Verify points increased
    console.log('\nFetching customer profile after cancellation...');
    const profileRes2 = await fetch(`${API_URL}/account/profile`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const profileData2 = await profileRes2.json();
    const newPoints = profileData2.data?.rewardPoints || 0;
    console.log('Reward Points after cancellation refund:', newPoints);

    // 5. Create new order and use points
    console.log('\nCreating a new order USING reward points...');
    const orderPayload2 = {
      items: [{ medicineId: 3, quantity: 2 }],
      shippingAddress: {
        id: 1, title: 'Home', street: '123 Test St', city: 'Test City', state: 'TS', zipCode: '123456', country: 'India'
      },
      paymentMethod: 'COD',
      useRewardPoints: true
    };

    const orderRes2 = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload2)
    });
    const orderData2 = await orderRes2.json();
    
    if (orderData2.success) {
      console.log('Order 2 created successfully! ID:', orderData2.data.id);
      console.log('Order 2 Final Amount (After points deduction):', orderData2.data.finalAmount);
    } else {
      console.error('Order 2 creation failed:', orderData2);
    }

    // 6. Check points were deducted
    console.log('\nFetching customer profile after spending points...');
    const profileRes3 = await fetch(`${API_URL}/account/profile`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const profileData3 = await profileRes3.json();
    console.log('Final Reward Points:', profileData3.data?.rewardPoints || 0);
    
    console.log('\n--- FLOW TEST COMPLETE ---');
  } catch (error) {
    console.error('Test error:', error);
  }
};

testFlow();
