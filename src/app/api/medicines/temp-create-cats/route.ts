export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Category } from '../../../../models';

export async function GET() {
  try {
    const toAdd = [
      { name: 'Immunity', slug: 'immunity', description: 'Immunity Boosters', image: '' },
      { name: 'Bone Health', slug: 'bone-health', description: 'Bone and Joint Health', image: '' },
      { name: 'Sleep & Stress', slug: 'sleep-stress', description: 'Sleep and Stress Relief', image: '' },
      { name: 'Cold & Flu', slug: 'cold-flu', description: 'Cold and Flu Remedies', image: '' }
    ];

    const results = [];
    for (const cat of toAdd) {
      const [category, created] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });
      results.push({ name: category.name, id: category.id, created });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
