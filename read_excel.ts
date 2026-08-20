import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('d:\\dosebox\\AI_Generated_Success.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet).slice(0, 5);

console.log(JSON.stringify(data, null, 2));
