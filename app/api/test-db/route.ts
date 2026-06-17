import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from('transactions')
    .select('type, status, amount, transaction_date')
    .limit(10);
    
  return Response.json({ data, error });
}
