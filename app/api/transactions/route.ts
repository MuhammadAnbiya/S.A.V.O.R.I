import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search');
    
    // Pagination offset
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*)', { count: 'exact' })
      .eq('user_id', session.user.id)
      .is('deleted_at', null);

    // Apply search filter if exists
    if (search) {
      query = query.ilike('vendor_name', `%${search}%`);
    }
    
    // Apply sorting
    const sortField = searchParams.get('sort') || 'transaction_date';
    const sortOrder = searchParams.get('order') || 'desc';
    query = query
      .order(sortField, { ascending: sortOrder === 'asc' })
      .order('created_at', { ascending: false }); // secondary sort for same-day transactions

    // Apply pagination
    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data,
      metadata: {
        page,
        limit,
        total: count,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { items, ...transactionData } = body;

    // 1. Insert Transaction
    const { data: transaction, error: trxError } = await supabase
      .from('transactions')
      .insert({
        ...transactionData,
        user_id: session.user.id
      })
      .select()
      .single();

    if (trxError) throw trxError;

    // 2. Insert Items if present
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        ...item,
        transaction_id: transaction.id
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    // 3. Create Audit Log
    await createAuditLog(supabase, {
      userId: session.user.id,
      tableName: 'transactions',
      recordId: transaction.id,
      action: 'CREATE',
      newValues: { ...transactionData, items }
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
