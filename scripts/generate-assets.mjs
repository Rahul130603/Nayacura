/**
 * Generates Nayacura's original demo artwork. The profiles are deliberately
 * illustrated, not photographs: using a real person's face for a fictional
 * clinician would imply an identity and credential that do not exist.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'frontend', 'public', 'images');
mkdirSync(join(root, 'portraits'), { recursive: true });
mkdirSync(join(root, 'art'), { recursive: true });

const doctors = [
  {
    file: 'aanya',
    skin: '#B97C8B',
    skinShade: '#9D6272',
    hair: '#190D23',
    hairLight: '#3B214A',
    clothes: '#571A37',
    bgA: '#190D23',
    bgB: '#6E35A4',
    accent: '#E8A0B7',
    style: 'bun',
    features: 'earrings',
  },
  {
    file: 'arjun',
    skin: '#9A6472',
    skinShade: '#7C4B5A',
    hair: '#120A18',
    hairLight: '#33203E',
    clothes: '#23132F',
    bgA: '#09060F',
    bgB: '#571A37',
    accent: '#C9A7F5',
    style: 'short',
    features: 'glasses',
  },
  {
    file: 'meera',
    skin: '#C58F97',
    skinShade: '#A26D78',
    hair: '#2A1734',
    hairLight: '#4B2D5A',
    clothes: '#6E35A4',
    bgA: '#1B0E25',
    bgB: '#571A37',
    accent: '#E8A0B7',
    style: 'waves',
    features: 'necklace',
  },
  {
    file: 'kabir',
    skin: '#B07A86',
    skinShade: '#8F5D6B',
    hair: '#24152D',
    hairLight: '#412A4D',
    clothes: '#571A37',
    bgA: '#0B0711',
    bgB: '#6E35A4',
    accent: '#C9A7F5',
    style: 'curls',
    features: 'beard',
  },
  {
    file: 'nila',
    skin: '#8E5968',
    skinShade: '#704654',
    hair: '#0D0812',
    hairLight: '#33203E',
    clothes: '#7A4363',
    bgA: '#190D23',
    bgB: '#3E1D48',
    accent: '#E8A0B7',
    style: 'bob',
    features: 'earrings',
  },
  {
    file: 'rahul',
    skin: '#C08A96',
    skinShade: '#9E6B78',
    hair: '#170D1E',
    hairLight: '#392046',
    clothes: '#2A1734',
    bgA: '#09060F',
    bgB: '#4C1E40',
    accent: '#C9A7F5',
    style: 'side',
    features: 'glasses',
  },
  {
    file: 'sana',
    skin: '#A97280',
    skinShade: '#895563',
    hair: '#190D23',
    hairLight: '#3D2548',
    clothes: '#6E35A4',
    bgA: '#160C1E',
    bgB: '#571A37',
    accent: '#E8A0B7',
    style: 'long',
    features: 'necklace',
  },
  {
    file: 'vikram',
    skin: '#986270',
    skinShade: '#7A4A58',
    hair: '#0C0711',
    hairLight: '#2E1B38',
    clothes: '#571A37',
    bgA: '#0A0710',
    bgB: '#6E35A4',
    accent: '#C9A7F5',
    style: 'short',
    features: 'beard',
  },
];

function hairMarkup(doc) {
  const { hair, hairLight, style } = doc;
  if (style === 'bun') {
    return `
      <circle cx="300" cy="154" r="58" fill="${hair}"/>
      <path d="M214 255c0-88 38-148 86-148s86 60 86 148c-8-38-35-62-86-62s-78 24-86 62Z" fill="${hair}"/>
      <path d="M235 235c20-34 49-48 65-48s45 14 65 48" fill="none" stroke="${hairLight}" stroke-width="8" stroke-linecap="round"/>
      <path d="M207 290c-4 54 2 94 15 125-26-18-44-56-44-102 0-27 11-50 29-62Z" fill="${hair}"/>
      <path d="M393 290c4 54-2 94-15 125 26-18 44-56 44-102 0-27-11-50-29-62Z" fill="${hair}"/>`;
  }
  if (style === 'waves') {
    return `
      <path d="M210 306c-30-58-15-155 33-190 32-24 84-24 116 2 46 38 59 130 31 188-4-50-15-84-36-104-33 21-78 20-110-2-20 24-30 61-34 106Z" fill="${hair}"/>
      <path d="M220 264c-22 54-20 112 4 161-27-11-50-49-52-88-2-29 12-65 29-83Z" fill="${hair}"/>
      <path d="M380 264c22 54 20 112-4 161 27-11 50-49 52-88 2-29-12-65-29-83Z" fill="${hair}"/>
      <path d="M235 244c19-31 44-44 65-44s48 12 66 44" fill="none" stroke="${hairLight}" stroke-width="9" stroke-linecap="round"/>`;
  }
  if (style === 'bob') {
    return `
      <path d="M208 288c-5-95 32-166 92-166 61 0 96 72 92 166-5 64-20 104-30 124 2-51-1-92-11-120-28 16-75 16-104 0-10 28-13 69-11 120-12-22-24-61-28-124Z" fill="${hair}"/>
      <path d="M245 236c17-27 37-39 55-39s39 12 56 39" fill="none" stroke="${hairLight}" stroke-width="8" stroke-linecap="round"/>`;
  }
  if (style === 'long') {
    return `
      <path d="M209 314c-12-107 30-184 92-184 64 0 105 78 91 184-8 60-15 106-30 152 6-58 1-120-9-152-27 17-77 17-104 0-10 31-14 93-9 152-15-47-22-92-31-152Z" fill="${hair}"/>
      <path d="M232 240c19-29 43-42 68-42s49 13 68 42" fill="none" stroke="${hairLight}" stroke-width="8" stroke-linecap="round"/>`;
  }
  if (style === 'curls') {
    return `
      <g fill="${hair}">
        <circle cx="241" cy="210" r="32"/><circle cx="281" cy="178" r="35"/><circle cx="328" cy="178" r="34"/><circle cx="365" cy="211" r="30"/>
        <circle cx="215" cy="255" r="26"/><circle cx="387" cy="255" r="26"/>
      </g>
      <path d="M233 246c14-36 39-56 67-56s53 20 67 56" fill="none" stroke="${hairLight}" stroke-width="8" stroke-linecap="round"/>`;
  }
  if (style === 'side') {
    return `
      <path d="M218 272c-9-90 28-154 85-154 55 0 89 56 87 140-14-31-35-49-65-55-10 35-46 56-92 56-3 7-8 11-15 13Z" fill="${hair}"/>
      <path d="M255 197c25-19 55-24 82-12" fill="none" stroke="${hairLight}" stroke-width="8" stroke-linecap="round"/>`;
  }
  return `
    <path d="M214 258c0-86 35-143 86-143s86 57 86 143c-11-35-36-54-67-59-18 23-55 34-91 31-5 11-10 20-14 28Z" fill="${hair}"/>
    <path d="M250 201c27-19 57-22 82-9" fill="none" stroke="${hairLight}" stroke-width="8" stroke-linecap="round"/>`;
}

function featuresMarkup(doc) {
  const bits = [];
  if (doc.features === 'glasses') {
    bits.push(`
      <g fill="none" stroke="#C9A7F5" stroke-width="3" opacity=".8">
        <rect x="252" y="307" width="42" height="32" rx="14"/>
        <rect x="306" y="307" width="42" height="32" rx="14"/>
        <path d="M294 320h12M246 318l-16-5M354 318l16-5"/>
      </g>`);
  }
  if (doc.features === 'earrings') {
    bits.push(`
      <g fill="none" stroke="#E8A0B7" stroke-width="3">
        <circle cx="218" cy="360" r="9"/><circle cx="382" cy="360" r="9"/>
      </g>`);
  }
  if (doc.features === 'necklace') {
    bits.push(`
      <path d="M268 445c8 30 56 30 64 0" fill="none" stroke="#E8A0B7" stroke-width="3" opacity=".8"/>
      <circle cx="300" cy="471" r="5" fill="#E8A0B7" opacity=".9"/>`);
  }
  if (doc.features === 'beard') {
    bits.push(`
      <path d="M244 374c7 52 27 76 56 76s49-24 56-76c-3 69-21 112-56 112s-53-43-56-112Z" fill="${doc.hair}" opacity=".9"/>
      <path d="M271 441c8 6 50 6 58 0" fill="none" stroke="${doc.hairLight}" stroke-width="3" opacity=".55"/>`);
  }
  return bits.join('');
}

function portrait(doc) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 760" role="img" aria-label="Illustrated fictional clinician portrait">
  <defs>
    <radialGradient id="bg" cx=".5" cy=".28" r=".85">
      <stop offset="0" stop-color="${doc.bgB}"/><stop offset=".58" stop-color="${doc.bgA}"/><stop offset="1" stop-color="#09060F"/>
    </radialGradient>
    <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="${doc.clothes}"/><stop offset="1" stop-color="#190D23"/>
    </linearGradient>
    <linearGradient id="skin" x1=".3" y1="0" x2=".7" y2="1">
      <stop stop-color="${doc.skin}"/><stop offset="1" stop-color="${doc.skinShade}"/>
    </linearGradient>
    <radialGradient id="halo"><stop stop-color="${doc.accent}" stop-opacity=".28"/><stop offset="1" stop-color="${doc.accent}" stop-opacity="0"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="26"/></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".055"/></feComponentTransfer>
    </filter>
    <clipPath id="frame"><rect width="600" height="760" rx="0"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="600" height="760" fill="url(#bg)"/>
    <circle cx="300" cy="290" r="244" fill="url(#halo)"/>
    <circle cx="300" cy="330" r="210" fill="none" stroke="${doc.accent}" stroke-opacity=".14"/>
    <circle cx="300" cy="330" r="238" fill="none" stroke="${doc.accent}" stroke-opacity=".07"/>
    <circle cx="92" cy="120" r="72" fill="${doc.clothes}" opacity=".2" filter="url(#soft)"/>
    <circle cx="518" cy="640" r="110" fill="${doc.accent}" opacity=".08" filter="url(#soft)"/>
    <path d="M26 620c0-116 86-183 274-183s274 67 274 183v140H26Z" fill="url(#cloth)"/>
    <path d="M250 447h100v119c-18 34-82 34-100 0Z" fill="url(#skin)"/>
    <path d="M250 486c26 23 74 23 100 0v39c-21 27-79 27-100 0Z" fill="${doc.skinShade}" opacity=".45"/>
    <ellipse cx="300" cy="341" rx="96" ry="122" fill="url(#skin)"/>
    <ellipse cx="204" cy="348" rx="18" ry="29" fill="${doc.skinShade}"/>
    <ellipse cx="396" cy="348" rx="18" ry="29" fill="${doc.skinShade}"/>
    ${hairMarkup(doc)}
    <path d="M258 316c12-7 25-7 37 0" fill="none" stroke="${doc.hair}" stroke-width="5" stroke-linecap="round" opacity=".65"/>
    <path d="M305 316c12-7 25-7 37 0" fill="none" stroke="${doc.hair}" stroke-width="5" stroke-linecap="round" opacity=".65"/>
    <path d="M263 340c9-5 20-5 29 0" fill="none" stroke="#2A152F" stroke-width="4" stroke-linecap="round"/>
    <path d="M308 340c9-5 20-5 29 0" fill="none" stroke="#2A152F" stroke-width="4" stroke-linecap="round"/>
    <path d="M300 345c-3 18-7 29-2 34 4 3 9 2 13-2" fill="none" stroke="${doc.skinShade}" stroke-width="3" stroke-linecap="round"/>
    <path d="M280 405c13 8 27 8 40 0" fill="none" stroke="#6E2F45" stroke-width="4" stroke-linecap="round"/>
    <path d="M286 404c10 5 18 5 28 0" fill="${doc.accent}" opacity=".55"/>
    ${featuresMarkup(doc)}
    <path d="M178 720c32-40 72-57 122-61M422 720c-32-40-72-57-122-61" fill="none" stroke="${doc.accent}" stroke-width="2" opacity=".22"/>
    <path d="M370 610c0 70 44 88 44 130 0 25-15 43-42 46" fill="none" stroke="${doc.accent}" stroke-width="4" opacity=".5"/>
    <circle cx="416" cy="789" r="14" fill="${doc.accent}" opacity=".65"/>
    <rect width="600" height="760" filter="url(#grain)" opacity=".55"/>
  </g>
</svg>`;
}

for (const doc of doctors) {
  writeFileSync(join(root, 'portraits', `${doc.file}.svg`), portrait(doc));
}

const art = {
  connection: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="Abstract artwork of two interlocking forms">
  <defs>
    <radialGradient id="a" cx=".35" cy=".3" r=".8"><stop stop-color="#6E35A4"/><stop offset=".55" stop-color="#190D23"/><stop offset="1" stop-color="#09060F"/></radialGradient>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E8A0B7"/><stop offset=".5" stop-color="#C9A7F5"/><stop offset="1" stop-color="#571A37"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="34"/></filter>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer></filter>
  </defs>
  <rect width="1200" height="900" fill="url(#a)"/>
  <ellipse cx="610" cy="450" rx="390" ry="340" fill="#571A37" opacity=".26" filter="url(#blur)"/>
  <g transform="translate(600 450) rotate(-18)" fill="none">
    <ellipse rx="330" ry="172" stroke="url(#b)" stroke-width="1.5" opacity=".65"/>
    <ellipse rx="270" ry="140" stroke="#C9A7F5" stroke-width="1" opacity=".35" transform="rotate(58)"/>
    <ellipse rx="205" ry="106" stroke="#E8A0B7" stroke-width="1" opacity=".4" transform="rotate(-58)"/>
    <path d="M-195 0c0-95 68-172 151-172S107-95 107 0 39 172-44 172-195 95-195 0Z" fill="#6E35A4" opacity=".2" transform="translate(-80 0)"/>
    <path d="M-50 0c0-95 68-172 151-172S252-95 252 0 184 172 101 172 50 95 50 0Z" fill="#E8A0B7" opacity=".12" transform="translate(40 0)"/>
    <circle r="8" fill="#E8A0B7"/><circle r="13" fill="none" stroke="#C9A7F5" opacity=".5"/>
  </g>
  <rect width="1200" height="900" filter="url(#noise)" opacity=".65"/>
</svg>`,
  stillness: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" role="img" aria-label="Abstract editorial still life">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#190D23"/><stop offset=".6" stop-color="#2A112B"/><stop offset="1" stop-color="#09060F"/></linearGradient>
    <linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#C9A7F5"/><stop offset=".5" stop-color="#6E35A4"/><stop offset="1" stop-color="#571A37"/></linearGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="430" cy="430" r="280" fill="#6E35A4" opacity=".14" filter="url(#soft)"/>
  <ellipse cx="450" cy="1010" rx="260" ry="58" fill="#09060F" opacity=".65" filter="url(#soft)"/>
  <path d="M310 780c-58-112-22-244 44-312 44 96 58 210 30 312Z" fill="#571A37" opacity=".8"/>
  <path d="M338 786c-9-141 22-255 93-342 27 116 14 235-38 342Z" fill="#6E35A4" opacity=".75"/>
  <path d="M415 790c22-124 94-214 187-256-7 110-68 204-155 258Z" fill="#E8A0B7" opacity=".45"/>
  <path d="M426 800c54-91 133-149 224-168-48 86-123 151-213 185Z" fill="#C9A7F5" opacity=".3"/>
  <path d="M300 792h310l-32 255H335Z" fill="url(#v)"/>
  <path d="M308 796h294" stroke="#F8F2F6" stroke-opacity=".35"/>
  <g fill="none" stroke="#E8A0B7" stroke-width="1.3" opacity=".45">
    <circle cx="455" cy="920" r="78"/><circle cx="455" cy="920" r="102"/><path d="M377 920h156M455 842v156"/>
  </g>
  <rect width="900" height="1200" filter="url(#n)" opacity=".7"/>
</svg>`,
  space: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" role="img" aria-label="Abstract architectural space in plum and rose">
  <defs>
    <linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#09060F"/><stop offset=".5" stop-color="#2A112B"/><stop offset="1" stop-color="#190D23"/></linearGradient>
    <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#E8A0B7" stop-opacity=".6"/><stop offset=".5" stop-color="#6E35A4" stop-opacity=".2"/><stop offset="1" stop-color="#09060F" stop-opacity="0"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="38"/></filter>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="4"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer></filter>
  </defs>
  <rect width="1400" height="900" fill="url(#b)"/>
  <circle cx="700" cy="470" r="330" fill="#6E35A4" opacity=".22" filter="url(#soft)"/>
  <path d="M420 760V430c0-170 125-300 280-300s280 130 280 300v330Z" fill="url(#arch)" stroke="#C9A7F5" stroke-opacity=".28"/>
  <path d="M480 760V448c0-126 99-225 220-225s220 99 220 225v312Z" fill="none" stroke="#E8A0B7" stroke-opacity=".25"/>
  <path d="M540 760V468c0-90 72-160 160-160s160 70 160 160v292Z" fill="#09060F" opacity=".4" stroke="#C9A7F5" stroke-opacity=".2"/>
  <path d="M700 308v452" stroke="#E8A0B7" stroke-opacity=".14"/>
  <ellipse cx="700" cy="792" rx="350" ry="55" fill="#E8A0B7" opacity=".06" filter="url(#soft)"/>
  <g fill="#C9A7F5"><circle cx="560" cy="650" r="2" opacity=".5"/><circle cx="824" cy="520" r="2.5" opacity=".4"/><circle cx="790" cy="690" r="1.5" opacity=".6"/></g>
  <rect width="1400" height="900" filter="url(#n)" opacity=".7"/>
</svg>`,
};

for (const [name, svg] of Object.entries(art)) {
  writeFileSync(join(root, 'art', `${name}.svg`), svg);
}

const patternNames = ['plum', 'rose', 'lavender', 'burgundy', 'mauve', 'midnight', 'veil', 'orbit'];
const pairs = [
  ['#190D23', '#6E35A4', '#E8A0B7'],
  ['#571A37', '#C9A7F5', '#F8F2F6'],
  ['#2A112B', '#E8A0B7', '#C9A7F5'],
  ['#09060F', '#571A37', '#6E35A4'],
  ['#24132D', '#A78BA8', '#C9A7F5'],
  ['#09060F', '#2A112B', '#E8A0B7'],
  ['#190D23', '#571A37', '#C9A7F5'],
  ['#0D0813', '#6E35A4', '#E8A0B7'],
];
patternNames.forEach((name, index) => {
  const [bg, c1, c2] = pairs[index];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" role="img" aria-label="Abstract editorial pattern ${index + 1}">
  <defs>
    <radialGradient id="g" cx="${30 + index * 6}%" cy="${30 + (index % 3) * 15}%" r="85%"><stop stop-color="${c1}"/><stop offset=".7" stop-color="${bg}"/><stop offset="1" stop-color="#09060F"/></radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="${42 + index * 3}"/></filter>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".06"/></feComponentTransfer></filter>
  </defs>
  <rect width="1000" height="700" fill="url(#g)"/>
  <circle cx="${720 - index * 20}" cy="${240 + (index % 2) * 80}" r="${170 + index * 7}" fill="${c2}" opacity=".16" filter="url(#soft)"/>
  <g transform="translate(${480 + index * 10} ${350 + (index % 3) * 10}) rotate(${index * 13 - 20})" fill="none">
    <ellipse rx="${210 + index * 8}" ry="${92 + index * 4}" stroke="${c2}" stroke-opacity=".45"/>
    <ellipse rx="${150 + index * 6}" ry="${66 + index * 3}" stroke="${c2}" stroke-opacity=".26" transform="rotate(62)"/>
    <ellipse rx="${95 + index * 4}" ry="${42 + index * 2}" stroke="${c2}" stroke-opacity=".4" transform="rotate(-48)"/>
    <circle r="${4 + index}" fill="${c2}"/>
  </g>
  <path d="M0 ${560 + index * 6}c250-80 440 30 660-40s310 10 340 0v180H0Z" fill="${c1}" opacity=".18"/>
  <rect width="1000" height="700" filter="url(#n)" opacity=".75"/>
</svg>`;
  writeFileSync(join(root, 'art', `${name}.svg`), svg);
});

console.log(`Generated ${doctors.length} portraits and ${Object.keys(art).length + patternNames.length} artwork files.`);
