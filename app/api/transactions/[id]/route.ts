import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data, error } = await supabase
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { items, ...updateData } = body;

    // Get old values for audit
    const { data: oldData } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    // 1. Update Transaction
    const { data: transaction, error: trxError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (trxError) throw trxError;

    // 2. Handle Items (simplified: delete old, insert new)
    if (items) {
      await supabase.from('transaction_items').delete().eq('transaction_id', id);
      
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          ...item,
          transaction_id: id
        }));
        const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }
    }

    // 3. Create Audit Log
    await createAuditLog(supabase, {
      userId: session.user.id,
      tableName: 'transactions',
      recordId: id,
      action: 'UPDATE',
      oldValues: oldData,
      newValues: { ...updateData, items }
    });

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Soft delete
    const { error: trxError } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (trxError) throw trxError;

    // Create Audit Log
    await createAuditLog(supabase, {
      userId: session.user.id,
      tableName: 'transactions',
      recordId: id,
      action: 'DELETE',
      reason: 'User requested soft delete'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
