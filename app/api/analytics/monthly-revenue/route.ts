import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('transaction_date, amount')
      .eq('type', 'income')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    const monthlyMap: Record<string, number> = {};
    if (transactions) {
      transactions.forEach((tx) => {
        const month = new Date(tx.transaction_date).toLocaleDateString('id-ID', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + (tx.amount || 0);
      });
    }

    const monthlyData = Object.keys(monthlyMap).map(month => ({
      month,
      actual_revenue: monthlyMap[month],
      prev_year_revenue: 0,
      target: 0
    }));

    return NextResponse.json({ data: monthlyData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
