from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
from datetime import datetime, timedelta
import joblib
import os

app = FastAPI()

class ForecastRequest(BaseModel):
    branch_id: str
    data_points: int

# Attempt to load the model if it exists
@app.get("/")
def read_root():
    return {"status": "healthy"}

try:
    model = joblib.load("model_xgb.pkl")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load model_xgb.pkl: {e}.")
    model = None

@app.post("/predict")
def predict_sales(req: ForecastRequest):
    try:
        import pandas as pd
        import numpy as np
        
        if model is None:
            raise HTTPException(status_code=500, detail="XGBoost model is not loaded.")
            
        # Get feature names from model
        expected_features = model.feature_names_in_ if hasattr(model, 'feature_names_in_') else model.get_booster().feature_names
        
        forecasts = []
        base_sales = 5000000 # Default base sales
        today = datetime.now()
        
        for i in range(1, req.data_points + 1):
            target_date = today + timedelta(days=i)
            
            row = {}
            for feat in expected_features:
                if feat == 'year': row[feat] = target_date.year
                elif feat == 'month': row[feat] = target_date.month
                elif feat == 'day': row[feat] = target_date.day
                elif feat == 'dayofweek': row[feat] = target_date.weekday()
                elif feat == 'dayofyear': row[feat] = target_date.timetuple().tm_yday
                elif feat == 'weekofyear': row[feat] = target_date.isocalendar()[1]
                elif feat == 'is_weekend': row[feat] = 1 if target_date.weekday() >= 5 else 0
                elif feat == 'Total_Penjualan_capped': row[feat] = base_sales
                else:
                    if 'rolling_mean' in feat or 'lag' in feat:
                        row[feat] = base_sales
                    elif 'sin' in feat or 'cos' in feat:
                        row[feat] = 0.0
                    else:
                        row[feat] = 0.0
                        
            df = pd.DataFrame([row])
            df = df[expected_features]
            
            pred = model.predict(df)[0]
            
            forecasts.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "predicted_revenue": round(float(pred))
            })
            
        return {"forecast": forecasts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
