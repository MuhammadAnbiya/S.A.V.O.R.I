import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const branchIds = searchParams.getAll('branch_ids[]');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Real implementation would do aggregations here.
    // For now, we return a structured payload matching the brief's requirements.
    // In a real scenario, this would use Supabase RPC or complex views.
    
    const kpiData = {
      penjualan: {
        avg_per_transaction: 450000,
        total_transactions: 1250,
        net_sales: 562500000,
        total_items: 4500,
        delta_avg: 5.2,
        delta_net_sales: 12.4,
        status: "green"
      },
      anomali: {
        total_refunds: 1500000,
        refund_count: 5,
        total_void: 500000,
        void_count: 2,
        void_percentage: 0.1,
        delta_refunds: -2.5,
        delta_void: -1.0,
        status_refunds: "green",
        status_void: "green"
      }
    };

    return NextResponse.json({ data: kpiData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
