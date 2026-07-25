import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return {
    title: `DoseBox Invoice #OD-${id}`,
    description: `Click here to view and download your official DoseBox invoice for order OD-${id}.`,
    openGraph: {
      title: `DoseBox Invoice #OD-${id}`,
      description: `Click here to view and download your official DoseBox invoice for order OD-${id}.`,
      images: [
        {
          url: 'https://nk.socialflymediatech.com/Media.jpg',
          width: 800,
          height: 800,
          alt: 'DoseBox Logo',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `DoseBox Invoice #OD-${id}`,
      description: `Click here to view and download your official DoseBox invoice for order OD-${id}.`,
      images: ['https://nk.socialflymediatech.com/Media.jpg'],
    },
  };
}

export default async function InvoiceSharePage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return (
    <div style={{ margin: 0, padding: 0, height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {/* 
        This iframe will display the PDF perfectly in the browser. 
        Because this is an HTML page, WhatsApp will read the Open Graph metadata above
        and display the DoseBox logo instead of a generic PDF icon!
      */}
      <iframe 
        src={`/api/orders/${id}/invoice`} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`Invoice OD-${id}`}
      />
    </div>
  );
}
