export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Category } from '../../../models';

export async function GET() {
  try {
    const specialtySeed = [
      { name: 'Allergy Medication', slug: 'allergy-medication', image: '/categories/allergy-medication.jpg', description: 'Medicines for allergy relief, antihistamines, and nasal care', isActive: true },
      { name: 'Alzheimers', slug: 'alzheimers', image: '/categories/alzheimers.jpg', description: 'Cognitive care, memory support, and neurodegenerative therapeutics', isActive: true },
      { name: 'Anaesthetics', slug: 'anaesthetics', image: '/categories/anaesthetics.jpg', description: 'Local and general anaesthetic agents and surgical essentials', isActive: true },
      { name: 'Anemia', slug: 'anemia', image: '/categories/anemia.jpg', description: 'Iron therapy, hematology support, and red blood cell boosters', isActive: true },
      { name: 'Anti Cancer', slug: 'anti-cancer', image: '/categories/anti-cancer.jpg', description: 'Advanced oncology, chemotherapy, and immunotherapy drugs', isActive: true },
      { name: 'Antibacterials', slug: 'antibacterials', image: '/categories/antibacterials.jpg', description: 'Broad-spectrum antibiotics and critical care anti-infectives', isActive: true },
      { name: 'Anticoagulants', slug: 'anticoagulants', image: '/categories/anticoagulants.jpg', description: 'Blood thinners, cardiovascular care, and thrombosis prevention', isActive: true },
    ];

    for (const cat of specialtySeed) {
      const [existing, created] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });
      if (!created && existing.image && existing.image.includes('images.unsplash.com')) {
        await existing.update({ image: cat.image });
      }
    }

    let categories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
