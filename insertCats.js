const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const toAdd = [
  { name: 'Immunity', slug: 'immunity', description: 'Immunity Boosters', image: '' },
  { name: 'Bone Health', slug: 'bone-health', description: 'Bone and Joint Health', image: '' },
  { name: 'Sleep & Stress', slug: 'sleep-stress', description: 'Sleep and Stress Relief', image: '' },
  { name: 'Cold & Flu', slug: 'cold-flu', description: 'Cold and Flu Remedies', image: '' }
];

db.serialize(() => {
  const stmt = db.prepare("INSERT INTO Categories (name, slug, description, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))");
  toAdd.forEach(cat => {
    stmt.run(cat.name, cat.slug, cat.description, cat.image, function(err) {
      if (err) console.error(err.message);
      else console.log(`Inserted ${cat.slug} with ID ${this.lastID}`);
    });
  });
  stmt.finalize();
});

db.close();
