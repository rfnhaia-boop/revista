import type {Metadata} from 'next';
import './globals.css';
import './demo-mobile.css';
import './auth.css';
import './dashboard.css';
import './site.css';
const title='Revista NEW — Ideias, ciência e futuro';
const description='Leia, proponha perguntas e acompanhe a construção de conhecimento brasileiro.';
export const metadata:Metadata={
  metadataBase:new URL(process.env.APP_ORIGIN||'http://localhost:3020'),
  title,description,icons:{icon:'/favicon.svg'},
  openGraph:{type:'website',siteName:'Revista NEW',locale:'pt_BR',title,description,images:[{url:'/neural-glass.png',alt:'Arte abstrata em vidro violeta'}]},
  twitter:{card:'summary_large_image',title,description,images:['/neural-glass.png']},
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" className="dark"><body>{children}</body></html>;}
