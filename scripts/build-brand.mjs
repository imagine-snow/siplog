// Render repo-native SVG assets. No third-party fonts, images or services are needed.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const nextRequire=createRequire(require.resolve('next/package.json'));
const sharp=nextRequire('sharp');
const mark=await readFile('public/brand/mark.svg','utf8');
const ring=mark.match(/<path d="([^"]+)"/)[1];
const creamMark=`<path d="${ring}" fill="#faf5e9"/><circle cx="139" cy="37" r="9.4" fill="#faf5e9"/>`;
const svg=(content,w=512,h=w)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`;
const bg='<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#78323f"/><stop offset="1" stop-color="#8a424e"/></linearGradient></defs>';
const app=svg(bg+'<rect width="512" height="512" rx="112" fill="url(#bg)"/><g transform="translate(88 88) scale(2.1)">'+creamMark+'</g>');
const maskable=svg(bg+'<rect width="512" height="512" fill="url(#bg)"/><g transform="translate(88 88) scale(2.1)">'+creamMark+'</g>');
await mkdir('public/brand',{recursive:true});
await writeFile('public/brand/app-icon.svg',app);
await writeFile('public/icon.svg',app);
await writeFile('public/favicon.svg',app);
for(const size of [192,512]){
  await sharp(Buffer.from(app)).resize(size,size).png().toFile(`public/brand/icon-${size}.png`);
  await copyFile(`public/brand/icon-${size}.png`,`public/icon-${size}.png`);
}
await sharp(Buffer.from(maskable)).resize(512,512).png().toFile('public/brand/maskable-512.png');
await sharp(Buffer.from(maskable)).resize(180,180).png().toFile('public/brand/apple-touch-icon.png');
const markBody=mark.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const social=svg(`<rect width="1200" height="630" fill="#f8f6f1"/><g transform="translate(142 160) scale(1.9)">${markBody}</g><g fill="#71313e"><text x="515" y="286" font-family="Noto Serif CJK SC,SimSun,serif" font-size="112" letter-spacing="10">酒迹</text><text x="527" y="354" font-family="Georgia,serif" font-size="31" letter-spacing="16">SipLog</text></g><text x="517" y="425" fill="#817366" font-family="Microsoft YaHei,sans-serif" font-size="26">像记账一样，轻松记录每一次饮酒。</text>`,1200,630);
await writeFile('public/brand/social.svg',social);
await sharp(Buffer.from(social)).png().toFile('public/brand/social.png');
await copyFile('public/brand/social.png','public/og.png');
console.log('Brand SVGs, app icons and social preview rendered.');
