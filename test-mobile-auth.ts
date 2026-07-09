
import sequelize from './src/config/database';
import models from './src/models';

async function test() {
  try {
    const existing = await models.MobileAuthUser.findAll();
    console.log('MobileAuthUser records:', existing.length);
    console.log(existing);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

