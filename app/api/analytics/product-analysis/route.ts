import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mock data for Product Analysis
    const productData = {
      top_products: [
        { rank: 1, name: "Kopi Susu Gula Aren", volume: 1500, contribution: 25.5 },
        { rank: 2, name: "Nasi Goreng Spesial", volume: 1200, contribution: 20.1 },
        { rank: 3, name: "Es Teh Manis", volume: 3000, contribution: 15.0 },
        { rank: 4, name: "Mie Goreng Seafood", volume: 850, contribution: 12.5 },
        { rank: 5, name: "Ayam Penyet", volume: 720, contribution: 10.2 }
      ],
      bottom_products: [
        { rank: 45, name: "Jus Pare", volume: 15, contribution: 0.1, drop: 25 },
        { rank: 44, name: "Salad Buah", volume: 45, contribution: 0.5, drop: 10 },
        { rank: 43, name: "Teh Tawar", volume: 120, contribution: 0.8, drop: 5 }
      ],
      bcg_matrix: [
        { name: "Star", value: 35, fill: "var(--success)" },
        { name: "Question Mark", value: 20, fill: "#3498DB" },
        { name: "Plowhorse", value: 40, fill: "var(--warning)" },
        { name: "Dog", value: 5, fill: "var(--danger)" }
      ]
    };

    return NextResponse.json({ data: productData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
