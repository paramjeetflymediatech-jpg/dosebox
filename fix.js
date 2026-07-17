const fs = require('fs');
let code = fs.readFileSync('src/components/AppLayout.tsx', 'utf8');

code = code.replace(
  /<img src=\{globalSettings\['logo_url'\] \|\| "\/Media\.jpg"\} alt="Logo" className="h-10 sm:h-16 w-auto rounded-lg object-contain" \/>/g,
  '<Image src={globalSettings[\'logo_url\'] || "/Media.jpg"} alt="Logo" width={100} height={64} className="h-10 sm:h-16 w-auto rounded-lg object-contain" />'
);

code = code.replace(
  /<img src=\{\(user as any\)\.avatar\} alt="Profile" className="w-5 h-5 rounded-full object-cover" \/>/g,
  '<Image src={(user as any).avatar} alt="Profile" width={20} height={20} className="w-5 h-5 rounded-full object-cover" />'
);

code = code.replace(
  /<img src=\{globalSettings\['logo_url'\] \|\| "\/Media\.jpg"\} alt="Logo" className="h-10 w-auto object-contain" \/>/g,
  '<Image src={globalSettings[\'logo_url\'] || "/Media.jpg"} alt="Logo" width={80} height={40} className="h-10 w-auto object-contain" />'
);

code = code.replace(
  /<img src=\{globalSettings\['logo_url'\] \|\| "\/Media\.jpg"\} alt="Logo" className="h-16 w-auto rounded-lg object-contain bg-white p-1" \/>/g,
  '<Image src={globalSettings[\'logo_url\'] || "/Media.jpg"} alt="Logo" width={120} height={64} className="h-16 w-auto rounded-lg object-contain bg-white p-1" />'
);

code = code.replace(
  /<input\s+type="text"\s+placeholder="Search chronic care drugs, Galvus, Trastuzumab\.\.\."/g,
  '<input aria-label="Search medicines" type="text" placeholder="Search chronic care drugs, Galvus, Trastuzumab..."'
);

code = code.replace(
  /<button \s+onClick=\{handleSearch\}\s+className="absolute left-3 top-2\.5 p-1 hover:bg-slate-200 rounded-full transition-colors"\s*>/g,
  '<button onClick={handleSearch} aria-label="Search" className="absolute left-3 top-2.5 p-1 hover:bg-slate-200 rounded-full transition-colors">'
);

code = code.replace(
  /<input\s+type="text"\s+placeholder="Search chronic care drugs\.\.\."/g,
  '<input aria-label="Search medicines mobile" type="text" placeholder="Search chronic care drugs..."'
);

code = code.replace(
  /<button onClick=\{handleSearch\} className="absolute left-2\.5 top-1\.5 p-1 text-slate-400">/g,
  '<button aria-label="Search" onClick={handleSearch} className="absolute left-2.5 top-1.5 p-1 text-slate-400">'
);

fs.writeFileSync('src/components/AppLayout.tsx', code);

// Same for page.tsx
let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');

// replace <img src="..." />
// Wait, we need to handle different img cases in page.tsx
pageCode = pageCode.replace(
  /<img([^>]+)src=(['"])(.*?)\2([^>]*)>/g,
  (match, p1, p2, p3, p4) => {
    // If it's a static image URL from Unsplash or local, add width/height.
    // If it's dynamic like src={cat.image}, we can't do width/height easily unless we default it.
    // Next.js requires width/height for unoptimized images if not using `fill`.
    // Let's just use width={500} height={500} for all of them and let css scale them.
    return `<Image${p1}src=${p2}${p3}${p2} width={500} height={500}${p4} />`;
  }
);
// replace <img src={...} />
pageCode = pageCode.replace(
  /<img([^>]+)src=\{([^}]+)\}([^>]*)>/g,
  (match, p1, p2, p3) => {
    return `<Image${p1}src={${p2}} width={500} height={500}${p3} />`;
  }
);

if (!pageCode.includes('import Image')) {
    pageCode = pageCode.replace('import Link', 'import Link from \'next/link\';\nimport Image from \'next/image\';');
}

fs.writeFileSync('src/app/page.tsx', pageCode);

console.log("Done");
