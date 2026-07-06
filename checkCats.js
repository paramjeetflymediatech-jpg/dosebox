async function main() {
  const existingRes = await fetch('http://localhost:3000/api/medicines/categories');
  const existing = await existingRes.json();
  const existingNames = existing.data.map(c => c.slug);
  
  const toAdd = [
    { name: 'Immunity', slug: 'immunity', description: 'Immunity Boosters', image: '' },
    { name: 'Bone Health', slug: 'bone-health', description: 'Bone and Joint Health', image: '' },
    { name: 'Sleep & Stress', slug: 'sleep-stress', description: 'Sleep and Stress Relief', image: '' },
    { name: 'Cold & Flu', slug: 'cold-flu', description: 'Cold and Flu Remedies', image: '' }
  ];

  for (const cat of toAdd) {
    if (!existingNames.includes(cat.slug)) {
       // Assuming the backend has a POST /api/medicines/categories endpoint, let's try it.
       // Actually wait, let's just write to db via raw SQL if API POST doesn't exist
       console.log(`Need to add: ${cat.slug}`);
    } else {
       console.log(`Exists: ${cat.slug} (ID: ${existing.data.find(c => c.slug === cat.slug).id})`);
    }
  }
}
main().catch(console.error);
