import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mock data for Monthly Revenue Chart
    const monthlyData = [
      { month: 'Jan', actual_revenue: 12000000, prev_year_revenue: 10000000, target: 15000000 },
      { month: 'Feb', actual_revenue: 15000000, prev_year_revenue: 11000000, target: 15000000 },
      { month: 'Mar', actual_revenue: 14000000, prev_year_revenue: 12000000, target: 15000000 },
      { month: 'Apr', actual_revenue: 18000000, prev_year_revenue: 13000000, target: 16000000 },
      { month: 'May', actual_revenue: 22000000, prev_year_revenue: 15000000, target: 20000000 },
      { month: 'Jun', actual_revenue: 25000000, prev_year_revenue: 18000000, target: 22000000 },
    ];

    return NextResponse.json({ data: monthlyData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
