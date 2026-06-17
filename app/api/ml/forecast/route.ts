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
    const branchId = searchParams.get('branch_id');
    const days = parseInt(searchParams.get('days') || '7');

    // Strategi: Load model dari models/ folder
    // Jika models/*.pkl belum ada (pre-trained), generate mock forecast dari moving average historical data
    // agar fitur UI bisa ditest tanpa model real

    const { data: recentSales } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'income')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .limit(7);
      
    // Calculate an average base sale for the model, or default to 5jt
    let baseAmount = 5000000;
    if (recentSales && recentSales.length > 0) {
      baseAmount = recentSales.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) / recentSales.length;
    }

    // Call Python script
    const { exec } = require('child_process');
    const path = require('path');
    
    return new Promise((resolve) => {
      const inputPayload = JSON.stringify({
        days,
        base_sales: baseAmount
      });
      
      const pythonProcess = exec(
        // Use the venv python we just created
        `./venv/bin/python predict.py`,
        { cwd: process.cwd() },
        (error: any, stdout: string, stderr: string) => {
          if (error) {
            console.error('Python error:', error);
            console.error('Stderr:', stderr);
            return resolve(NextResponse.json({ error: 'Failed to run ML model' }, { status: 500 }));
          }
          
          try {
            const result = JSON.parse(stdout);
            if (result.status === 'error') {
              return resolve(NextResponse.json({ error: result.message }, { status: 500 }));
            }
            
            return resolve(NextResponse.json({
              status: "success",
              data: result.data,
              metadata: {
                model_version: "v2.0-xgboost-local",
                data_points_used: recentSales?.length || 0
              }
            }));
          } catch (e: any) {
            console.error("Parse error:", stdout);
            return resolve(NextResponse.json({ error: 'Invalid model output' }, { status: 500 }));
          }
        }
      );
      
      // Send input via stdin
      if (pythonProcess.stdin) {
        pythonProcess.stdin.write(inputPayload);
        pythonProcess.stdin.end();
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
