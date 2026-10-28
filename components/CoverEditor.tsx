'use client';
import {useRef,useState} from 'react';
import {useI18n} from '../lib/i18n';
import {prepareCover} from '../lib/photos';

export function CoverEditor({value,busy,save}:{value?:string;busy:boolean;save:(photo:string|null)=>Promise<boolean>}){
  const {tr}=useI18n();const file=useRef<HTMLInputElement>(null);const [working,setWorking]=useState(false);const [error,setError]=useState('');
  async function upload(f:File){
    setWorking(true);setError('');
    try{const photo=await prepareCover(f);await save(photo);}
    catch(e){setError((e as Error).message==='format'?tr('请选择 JPG、PNG 或 WebP 图片。','Choose a JPG, PNG or WebP image.'):(e as Error).message==='size'?tr('请选择 10 MB 以内的图片。','Choose an image smaller than 10 MB.'):tr('这张图片无法读取，请换一张。','This image could not be opened. Try another.'));}
    finally{setWorking(false);}
  }
  return <div className="cover-editor"><div><button className="button outline" disabled={busy||working} onClick={()=>file.current?.click()}>{working?tr('正在处理图片…','Preparing image…'):value?tr('更换封面','Change cover'):tr('添加酒瓶照片','Add a bottle photo')}</button>{value&&<button className="text-button" disabled={busy||working} onClick={()=>void save(null)}>{tr('移除封面','Remove cover')}</button>}</div><input ref={file} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void upload(f);}}/><p className="help">{tr('仅保存在本机，自动压缩，导出备份时会一起带走。','Kept on this device, resized automatically and included in your backup.')}</p>{error&&<p role="alert" className="error">{error}</p>}</div>;
}
