import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import type {Role} from '@/types/refill';
export async function getCurrentUserRole(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{supabase,user:null,role:null as Role|null};const{data:profile}=await supabase.from('users').select('role').eq('id',user.id).maybeSingle();return{supabase,user,role:(profile?.role as Role|undefined)??null};}
export async function requireRole(role:Role){const result=await getCurrentUserRole();if(!result.user)redirect('/login');if(result.role!==role)redirect(result.role?`/${result.role}`:'/login');return result as typeof result & {user:NonNullable<typeof result.user>;role:Role};}
