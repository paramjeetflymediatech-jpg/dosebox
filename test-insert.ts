
import sequelize from './src/config/database';
import models from './src/models';

async function test() {
  try {
    const res = await models.MobileAuthUser.create({
      userId: 7,
      userType: 'customer',
      deviceId: 'test_device',
      pushTokenPlatform: 'android',
      devicePlatform: 'android'
    });
    console.log('Inserted:', res.toJSON());
  } catch (err) {
    console.error('Insert Error:', err);
  } finally {
    process.exit(0);
  }
}
test();

