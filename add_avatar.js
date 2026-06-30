const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function addAvatar() {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255);");
    console.log("Successfully added avatar column.");
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log("Avatar column already exists.");
    } else {
      console.error("Error adding avatar column:", error);
    }
  } finally {
    await sequelize.close();
  }
}

addAvatar();
