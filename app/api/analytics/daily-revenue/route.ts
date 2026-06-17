import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch actual data from Supabase
    // We fetch all non-deleted income transactions and group by date
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('transaction_date, amount')
      .eq('type', 'income')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    // Aggregate by date
    const dailyMap: Record<string, number> = {};
    if (transactions) {
      transactions.forEach((tx) => {
        const date = new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        dailyMap[date] = (dailyMap[date] || 0) + (tx.amount || 0);
      });
    }

    // Convert map to array format expected by chart
    const dailyData = Object.keys(dailyMap).map(date => ({
      date,
      net_sales: dailyMap[date],
      prev_period_sales: 0, // In a real complex app, we'd query the previous period too
      target: 0, // Target could come from another table
      forecast: 0
    }));

    return NextResponse.json({ data: dailyData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
