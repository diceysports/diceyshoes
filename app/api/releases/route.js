import {NextResponse} from 'next/server';
import {releases} from '../../../lib/products';
export const revalidate=86400;
export async function GET(){
  return NextResponse.json({releases,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'s-maxage=86400, stale-while-revalidate=172800'}});
}
