import {NextResponse} from 'next/server';
import {releases} from '../../../lib/releases';
import {dailyReleaseUpdates} from '../../../lib/releases-daily';
export const revalidate=86400;
export async function GET(){
  const merged=[...releases,...dailyReleaseUpdates]
    .filter((item,index,all)=>index===all.findIndex(other=>other.date===item.date&&other.name===item.name))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  return NextResponse.json({releases:merged,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'s-maxage=86400, stale-while-revalidate=172800'}});
}
