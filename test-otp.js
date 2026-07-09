const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/forgot-password', {
      email: 'amandeepkumar.flymediatech@gmail.com' 
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
