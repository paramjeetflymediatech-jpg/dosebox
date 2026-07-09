
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('mrmed_db', 'root', 'root', { host: '127.0.0.1', dialect: 'mysql' });

const MobileAuthUser = sequelize.define('MobileAuthUser', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true, field: 'user_id' },
    providerId: { type: DataTypes.INTEGER, allowNull: true, field: 'provider_id' },
    userType: { type: DataTypes.ENUM('customer', 'provider', 'admin'), allowNull: false, field: 'user_type' },
    deviceId: { type: DataTypes.STRING(255), allowNull: true, field: 'device_id' },
}, { tableName: 'mobile_auth_users', timestamps: true, underscored: true });

async function test() {
  try {
    const res = await MobileAuthUser.create({
      userId: 7,
      userType: 'customer',
      deviceId: 'test_device_123'
    });
    console.log('Inserted!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
test();

