
const { Sequelize } = require('sequelize');
const s = new Sequelize('mrmed_db', 'root', 'root', { host: '127.0.0.1', dialect: 'mysql' });
s.query('SELECT password FROM users WHERE email=\'admin@dosebox.com\'').then(r => { console.log(r[0]); process.exit(0); }).catch(console.error);

