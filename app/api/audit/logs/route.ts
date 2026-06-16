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
    const table = searchParams.get('table');
    const action = searchParams.get('action');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (table) query = query.eq('table_name', table);
    if (action) query = query.eq('action', action);
    if (date) {
      query = query.gte('created_at', `${date}T00:00:00Z`);
      query = query.lte('created_at', `${date}T23:59:59Z`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
