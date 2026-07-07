import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    // You must provide a valid Place ID in your environment variables. 
    // We default to a placeholder if not found.
    const placeId = process.env.GOOGLE_PLACE_ID || 'ChIJN1t_tDeuEmsRUsoyG83frY4'; 

    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'Google Maps API key not configured' }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result.reviews) {
      // Return the top reviews (Google gives up to 5)
      return NextResponse.json({ 
        success: true, 
        rating: data.result.rating,
        reviews: data.result.reviews.filter((r: any) => r.rating >= 4) // only show 4+ star reviews
      });
    } else {
      return NextResponse.json({ success: false, message: 'No reviews found or invalid Place ID', details: data }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error fetching Google Reviews:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
