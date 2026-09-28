import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL} from '@/lib/supabase/config';

export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  const supabase=createServerClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll(){return request.cookies.getAll()},setAll(cookiesToSet){cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.redirect(new URL('/login',request.url));
  const {data:profile}=await supabase.from('users').select('role').eq('id',user.id).maybeSingle();
  const expected=request.nextUrl.pathname.split('/')[1];
  if(!profile?.role || !['pharmacy','provider','patient'].includes(profile.role) || profile.role!==expected) return NextResponse.redirect(new URL(profile?.role ? `/${profile.role}` : '/login',request.url));
  return response;
}
export const config={matcher:['/pharmacy/:path*','/provider/:path*','/patient/:path*']};
