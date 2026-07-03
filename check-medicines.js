const { Medicine } = require('./src/models');

async function run() {
  const meds = await Medicine.findAll();
  console.log('All medicines in DB:');
  meds.forEach(m => console.log(m.name));
  process.exit(0);
}
run();
