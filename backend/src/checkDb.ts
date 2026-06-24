import dotenv from 'dotenv';
dotenv.config();
import db from './models';
const { User } = db;

async function test() {
  try {
    const user = await User.findOne({ where: { email: 'customer@mrmed.com' } });
    if (user) {
      console.log('--- PASSWORD CHECK ---');
      console.log('user.password accessed directly:', user.password);
      console.log("user.getDataValue('password') accessed via Sequelize:", user.getDataValue('password'));
    } else {
      console.log('User not found');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
test();
