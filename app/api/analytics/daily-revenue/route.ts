import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mock data for Daily Revenue Chart
    const dailyData = [
      { date: '01 Jun', net_sales: 500000, prev_period_sales: 450000, target: 600000, forecast: 550000 },
      { date: '02 Jun', net_sales: 750000, prev_period_sales: 600000, target: 600000, forecast: 650000 },
      { date: '03 Jun', net_sales: 850000, prev_period_sales: 700000, target: 600000, forecast: 750000 },
      { date: '04 Jun', net_sales: 600000, prev_period_sales: 500000, target: 600000, forecast: 550000 },
      { date: '05 Jun', net_sales: 1200000, prev_period_sales: 900000, target: 800000, forecast: 1000000 },
      { date: '06 Jun', net_sales: 1500000, prev_period_sales: 1100000, target: 1000000, forecast: 1300000 },
      { date: '07 Jun', net_sales: 1800000, prev_period_sales: 1300000, target: 1200000, forecast: 1600000 },
    ];

    return NextResponse.json({ data: dailyData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
