import sequelize from './src/config/database';

async function fix() {
  try {
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME, INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND INDEX_NAME REGEXP '_[0-9]+$'
    `);
    
    for (const row of results as any[]) {
      console.log('Dropping index ' + row.INDEX_NAME + ' from ' + row.TABLE_NAME);
      await sequelize.query(`ALTER TABLE \`${row.TABLE_NAME}\` DROP INDEX \`${row.INDEX_NAME}\``);
    }
    
    console.log('Fixed indexes!');
    
    // Also, since they are migrating `medicines`, let's just make sure it creates it successfully
    await sequelize.sync({ alter: true });
    console.log('Sync complete');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
