import * as SequelizePackage from 'sequelize';
const Sq = (SequelizePackage as any).default || SequelizePackage;
console.log('Sq keys:', Object.keys(Sq).filter(k => k === 'Model' || k === 'DataTypes'));
console.log('Model init type:', typeof Sq.Model?.init);
