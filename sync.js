require('dotenv').config();
const http = require('http');

// Get the secret from the .env file
const secret = process.env.SYNC_SECRET || 'dosebox_admin_sync_2026';
const url = `http://localhost:3000/api/admin/sync?secret=${secret}`;

console.log('Triggering database sync via local API...');

http.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Success:', JSON.parse(data).message);
    } else {
      console.error('❌ Failed:', data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error connecting to the server. Make sure PM2 is running (pm2 start mrmned):', err.message);
});
