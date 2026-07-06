import { Category } from './src/models';

async function main() {
  const categories = [
    { name: 'Immunity', slug: 'immunity', description: 'Immunity Boosters', image: '' },
    { name: 'Bone Health', slug: 'bone-health', description: 'Bone and Joint Health', image: '' },
    { name: 'Sleep & Stress', slug: 'sleep-stress', description: 'Sleep and Stress Relief', image: '' },
    { name: 'Cold & Flu', slug: 'cold-flu', description: 'Cold and Flu Remedies', image: '' }
  ];

  for (const cat of categories) {
    const [category, created] = await Category.findOrCreate({
      where: { slug: cat.slug },
      defaults: cat
    });
    console.log(`Category: ${category.name}, ID: ${category.id}, Created: ${created}`);
  }
}

main().catch(console.error);
