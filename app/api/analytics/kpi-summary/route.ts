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

    const { data: transactions, error: trxError } = await supabase
      .from('transactions')
      .select('id, amount, type, status')
      .is('deleted_at', null);

    if (trxError) throw trxError;

    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select('qty, transactions!inner(deleted_at)')
      .is('transactions.deleted_at', null);

    if (itemsError) throw itemsError;

    let net_sales = 0;
    let total_transactions = 0;
    let total_items = 0;
    let total_refunds = 0;
    let refund_count = 0;

    if (transactions) {
      transactions.forEach(t => {
        if (t.type === 'income' || t.type === 'Pemasukan') {
          net_sales += Number(t.amount || 0);
          total_transactions += 1;
        } else if (t.type === 'refund' || t.type === 'Pengeluaran') {
          total_refunds += Number(t.amount || 0);
          refund_count += 1;
        }
      });
    }

    if (items) {
      items.forEach((item: any) => {
        total_items += Number(item.qty || 0);
      });
    }

    const avg_per_transaction = total_transactions > 0 ? net_sales / total_transactions : 0;

    const kpiData = {
      penjualan: {
        avg_per_transaction,
        total_transactions,
        net_sales,
        total_items,
        delta_avg: 0, // In real app, calculate diff from prev period
        delta_net_sales: 0,
        status: "green"
      },
      anomali: {
        total_refunds,
        refund_count,
        total_void: 0,
        void_count: 0,
        void_percentage: 0,
        delta_refunds: 0,
        delta_void: 0,
        status_refunds: "green",
        status_void: "green"
      }
    };

    return NextResponse.json({ data: kpiData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
