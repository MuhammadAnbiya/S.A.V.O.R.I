import sys
import json
import pickle
import pandas as pd
import numpy as np

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        days_to_predict = data.get('days', 7)
        base_sales = data.get('base_sales', 5000000)
        
        with open('model_xgb.pkl', 'rb') as f:
            model = pickle.load(f)
            
        expected_features = model.feature_names_in_ if hasattr(model, 'feature_names_in_') else model.get_booster().feature_names
        
        forecasts = []
        import datetime
        today = datetime.datetime.now()
        
        for i in range(1, days_to_predict + 1):
            target_date = today + datetime.timedelta(days=i)
            
            # Construct a row with the exact expected features
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
                    # Fill rolling stats and lags with realistic defaults or zeros
                    # To avoid XGBoost errors, we must provide numeric values
                    if 'rolling_mean' in feat or 'lag' in feat:
                        row[feat] = base_sales
                    elif 'sin' in feat or 'cos' in feat:
                        row[feat] = 0.0
                    else:
                        row[feat] = 0.0
                        
            df = pd.DataFrame([row])
            # Ensure columns are in exact order
            df = df[expected_features]
            
            # Predict
            pred = model.predict(df)[0]
            
            forecasts.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "predicted_revenue": round(float(pred)),
                "confidence_lower": round(float(pred) * 0.93),
                "confidence_upper": round(float(pred) * 1.07)
            })
            
        print(json.dumps({"status": "success", "data": forecasts}))
        
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))

if __name__ == "__main__":
    main()
