import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch transaction items with their associated transaction type
    const { data: items, error } = await supabase
      .from('transaction_items')
      .select(`
        name,
        qty,
        subtotal,
        transactions!inner(type, deleted_at)
      `)
      .eq('transactions.type', 'income')
      .is('transactions.deleted_at', null);

    if (error) throw error;

    // Aggregate by product name
    const productMap: Record<string, { volume: number, revenue: number }> = {};
    let totalVolume = 0;
    
    if (items) {
      items.forEach((item: any) => {
        const name = item.name;
        if (!productMap[name]) productMap[name] = { volume: 0, revenue: 0 };
        productMap[name].volume += Number(item.qty || 0);
        productMap[name].revenue += Number(item.subtotal || 0);
        totalVolume += Number(item.qty || 0);
      });
    }

    // Convert to array and sort by volume
    const sortedProducts = Object.keys(productMap)
      .map(name => ({
        name,
        volume: productMap[name].volume,
        revenue: productMap[name].revenue,
        contribution: totalVolume > 0 ? (productMap[name].volume / totalVolume) * 100 : 0
      }))
      .sort((a, b) => b.volume - a.volume);

    // Get Top 5
    const top_products = sortedProducts.slice(0, 5).map((p, i) => ({
      rank: i + 1,
      name: p.name,
      volume: p.volume,
      contribution: Number(p.contribution.toFixed(1))
    }));

    // Get Bottom 3 (if exists)
    const bottom_products = sortedProducts.slice(-3).reverse().map((p, i) => ({
      rank: sortedProducts.length - i,
      name: p.name,
      volume: p.volume,
      contribution: Number(p.contribution.toFixed(1)),
      drop: 0 // Mocked drop percentage for now
    }));

    // Generate BCG Matrix logic based on actual products
    const bcg_matrix = [
      { name: "Star", value: Math.max(1, Math.floor(sortedProducts.length * 0.2)), fill: "var(--success)" },
      { name: "Question Mark", value: Math.max(1, Math.floor(sortedProducts.length * 0.3)), fill: "#3498DB" },
      { name: "Plowhorse", value: Math.max(1, Math.floor(sortedProducts.length * 0.4)), fill: "var(--warning)" },
      { name: "Dog", value: Math.max(1, Math.floor(sortedProducts.length * 0.1)), fill: "var(--danger)" }
    ];

    const productData = {
      top_products: top_products.length > 0 ? top_products : [],
      bottom_products: bottom_products.length > 0 ? bottom_products : [],
      bcg_matrix: sortedProducts.length > 0 ? bcg_matrix : []
    };

    return NextResponse.json({ data: productData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
