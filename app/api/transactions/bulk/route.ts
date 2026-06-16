  import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { createAuditLog } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids, action, data } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty IDs array' }, { status: 400 });
    }

    const results = [];

    // Iterasi untuk memvalidasi ownership & melakukan bulk operation
    for (const id of ids) {
      // Validasi kepemilikan
      const { data: trx, error: fetchErr } = await supabase
        .from('transactions')
        .select('id')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (fetchErr || !trx) {
        results.push({ id, status: 'failed', reason: 'Unauthorized or Not Found' });
        continue;
      }

      if (action === 'delete') {
        const { error } = await supabase
          .from('transactions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          results.push({ id, status: 'failed', reason: error.message });
        } else {
          await createAuditLog(supabase, {
            userId: session.user.id,
            tableName: 'transactions',
            recordId: id,
            action: 'DELETE',
            reason: 'Bulk soft delete'
          });
          results.push({ id, status: 'success' });
        }
      } else if (action === 'categorize' && data?.category) {
        const { error } = await supabase
          .from('transactions')
          .update({ category: data.category })
          .eq('id', id);

        if (error) {
          results.push({ id, status: 'failed', reason: error.message });
        } else {
          await createAuditLog(supabase, {
            userId: session.user.id,
            tableName: 'transactions',
            recordId: id,
            action: 'UPDATE',
            newValues: { category: data.category },
            reason: 'Bulk categorize'
          });
          results.push({ id, status: 'success' });
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
