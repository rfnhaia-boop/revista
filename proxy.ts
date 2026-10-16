import {NextResponse} from 'next/server';
import { privateReviewMode } from './lib/runtime-mode';
export function proxy(request: Request){
  if (privateReviewMode() && new URL(request.url).pathname.startsWith('/api/') && !['GET','HEAD','OPTIONS'].includes(request.method))
    return NextResponse.json({error:'Contas e envios não estão conectados nesta versão de validação.'},{status:503});
  const response=NextResponse.next();response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if (privateReviewMode()) response.headers.set('X-Robots-Tag','noindex, nofollow');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.svg).*)']};
