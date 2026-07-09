import { Prescription } from './src/models/index.js';

async function testDelete() {
  try {
    const rx = await Prescription.findByPk(66);
    if (!rx) {
        console.log("Prescription not found, trying another");
        const all = await Prescription.findAll({ limit: 1 });
        if (all.length > 0) {
            await all[0].destroy();
            console.log("Deleted successfully");
        } else {
            console.log("No prescriptions found");
        }
        return;
    }
    await rx.destroy();
    console.log("Deleted successfully");
  } catch (err) {
    console.error("ERROR DELETING:", err);
  }
}

testDelete();
