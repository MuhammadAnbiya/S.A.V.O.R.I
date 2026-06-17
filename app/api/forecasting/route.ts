import { NextRequest, NextResponse } from 'next/server';

const FORECAST_API_URL = process.env.FORECAST_API_URL || 'http://127.0.0.1:8000/predict';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validasi input data sederhana (sesuaikan dengan kebutuhan Anda)
    if (typeof body.branch_id === 'undefined') {
      return NextResponse.json({ error: 'Missing branch_id' }, { status: 400 });
    }

    // Panggil FastAPI microservice untuk XGBoost
    const response = await fetch(FORECAST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Forecasting Service Error:", errorText);
      return NextResponse.json({ error: 'Forecasting service failed' }, { status: response.status });
    }

    const result = await response.json();
    
    return NextResponse.json({
      status: 'success',
      data: result
    });

  } catch (error: any) {
    console.error('Forecasting API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
