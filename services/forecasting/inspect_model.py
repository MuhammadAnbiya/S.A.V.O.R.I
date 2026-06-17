import pickle
import sys

try:
    with open('model_xgb.pkl', 'rb') as f:
        model = pickle.load(f)
    print("Model type:", type(model))
    
    if hasattr(model, 'feature_names_in_'):
        print("Expected features:", model.feature_names_in_)
    elif hasattr(model, 'get_booster'):
        print("Expected features:", model.get_booster().feature_names)
    else:
        print("Could not automatically determine feature names.")
        
except Exception as e:
    print(f"Error loading model: {e}")
