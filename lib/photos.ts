// Encoded local covers travel with JSON backups; remote/SVG URLs are never stored.
export const MAX_COVER_CHARS = 225000;
export const MAX_COVERS_CHARS = 16 * 1024 * 1024;
export function validCover(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_COVER_CHARS &&
    /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value);
}
export async function prepareCover(file: File): Promise<string> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('format');
  if (file.size > 10 * 1024 * 1024) throw new Error('size');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image();img.src=url;await img.decode();
    const scale=Math.min(1,640/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('decode');
    ctx.fillStyle='#f5f1e8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [.84,.7,.55,.4]){const result=canvas.toDataURL('image/jpeg',quality);if(validCover(result))return result;}
    throw new Error('size');
  } finally {URL.revokeObjectURL(url);}
}
