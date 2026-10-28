export function BrandMark({className='',tile=false}:{className?:string;tile?:boolean}){
  return <img className={`brand-symbol ${className}`} src={tile?'/brand/app-icon.svg':'/brand/mark.svg'} width="48" height="48" alt="" aria-hidden="true" draggable={false}/>;
}
