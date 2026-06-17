from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="SAVORI Forecasting API")

# Coba muat model XGBoost saat server dinyalakan
MODEL_PATH = "model_xgb.pkl"
try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("✅ Model XGBoost berhasil dimuat.")
    else:
        model = None
        print("⚠️ Warning: model_xgb.pkl tidak ditemukan di direktori ini. Pastikan Anda menaruh filenya di sini.")
except Exception as e:
    model = None
    print(f"❌ Error memuat model: {e}")

class ForecastRequest(BaseModel):
    # Sesuaikan kolom input ini dengan data/fitur saat Anda melatih (train) XGBoost
    # Contoh kolom:
    branch_id: int
    day_of_week: int
    is_holiday: int
    promo_active: int

@app.post("/predict")
async def predict_sales(data: ForecastRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model XGBoost belum tersedia di server.")
    
    try:
        # Konversi input API menjadi DataFrame Pandas agar sesuai dengan format model.predict() XGBoost
        input_data = pd.DataFrame([{
            "branch_id": data.branch_id,
            "day_of_week": data.day_of_week,
            "is_holiday": data.is_holiday,
            "promo_active": data.promo_active
        }])
        
        # Eksekusi prediksi
        prediction = model.predict(input_data)
        
        return {
            "status": "success",
            "predicted_sales": float(prediction[0])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal melakukan prediksi: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "up", "model_loaded": model is not None}

# Cara Menjalankan Server secara Lokal:
# 1. Pastikan Anda sudah install: pip install fastapi uvicorn xgboost joblib pandas
# 2. Jalankan: uvicorn main:app --reload --port 8000
