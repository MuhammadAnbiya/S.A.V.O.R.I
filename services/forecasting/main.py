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
    print(f"Warning: Could not load model_xgb.pkl: {e}. Using simulated data.")
    model = None

@app.post("/predict")
def predict_sales(req: ForecastRequest):
    try:
        # Generate future dates
        base_date = datetime.now()
        forecast = []
        
        # If we had a real model pipeline we would prepare the features here.
        # For now, we simulate realistic sales data projecting forward.
        base_revenue = 4500000 
        
        for i in range(1, 8): # 7 days forecast
            target_date = base_date + timedelta(days=i)
            
            # Weekend bump
            multiplier = 1.4 if target_date.weekday() >= 5 else 1.0
            noise = random.uniform(0.9, 1.1)
            
            predicted_value = int(base_revenue * multiplier * noise)
            
            forecast.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "predicted_revenue": predicted_value
            })
            
        return {"forecast": forecast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
