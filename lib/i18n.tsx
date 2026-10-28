'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { english } from './translations';
export type Language = 'zh' | 'en';
const Context = createContext<{lang:Language;setLang:(l:Language)=>void}>({lang:'zh',setLang:()=>{}});
export function LanguageProvider({children}:{children:ReactNode}) {
  const [lang,setLanguage]=useState<Language>('zh');
  useEffect(()=>{try{if(localStorage.getItem('jiuji-language')==='en')setLanguage('en');}catch{}},[]);
  useEffect(()=>{
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    document.title=lang==='zh'?'酒迹 SipLog｜轻松记录每一次饮酒':'SipLog | A simple drink journal';
    document.querySelector('link[rel="manifest"]')?.setAttribute('href',lang==='zh'?'/manifest.webmanifest?v=7':'/manifest.en.webmanifest?v=7');
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content',lang==='zh'?'酒迹':'SipLog');
  },[lang]);
  const setLang=(l:Language)=>{setLanguage(l);try{localStorage.setItem('jiuji-language',l);}catch{}};
  return <Context.Provider value={{lang,setLang}}>{children}</Context.Provider>;
}
export function useI18n(){
  const {lang,setLang}=useContext(Context);
  const tr=(zh:string,en:string)=>lang==='zh'?zh:en;
  const t=(value:string|number):string=>lang==='zh'?String(value):translate(String(value));
  return {lang,setLang,tr,t};
}
export function translate(value:string):string {
  if(english[value])return english[value];
  // Legacy display fragments; only UI text passes through this function, never saved identifiers.
  return value.replace(/[\u3400-\u9fff，。！？：、（）「」…]+/g,word=>english[word]??word.replace(/[\u3400-\u9fff]+/g,part=>english[part]??part)).replaceAll('，',', ').replaceAll('、',', ');
}
