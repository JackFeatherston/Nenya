from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
from datetime import datetime
import joblib
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fraud Detection API", version="1.0.0")

# Global variables for model and preprocessors
model = None
label_encoders = {}
scaler = None
feature_columns = []
is_trained = False

class TransactionFeatures(BaseModel):
    amount: float
    merchant_category: str
    payment_method: str
    device_type: str
    location_country: str
    hour_of_day: int
    day_of_week: int
    latitude: float
    longitude: float
    user_id: str
    merchant_name: str

class TrainingTransaction(BaseModel):
    transaction_id: str
    user_id: str
    merchant_name: str
    merchant_category: str
    amount: float
    currency: str
    timestamp: str
    payment_method: str
    card_last_four: str
    location_city: str
    location_country: str
    latitude: float
    longitude: float
    ip_address: str
    device_type: str
    is_fraudulent: bool

class TrainingRequest(BaseModel):
    transactions: List[TrainingTransaction]

class FraudPrediction(BaseModel):
    is_fraud: bool
    fraud_probability: float
    risk_score: float
    fraud_reason: str
    feature_importance: Dict[str, float]

def validate_and_normalize_risk_score(score: float) -> float:
    """Ensure risk score is always between 0 and 100"""
    if pd.isna(score) or not isinstance(score, (int, float)):
        return 0.0
    return max(0.0, min(100.0, float(score)))

def validate_and_normalize_probability(prob: float) -> float:
    """Ensure probability is always between 0 and 1"""
    if pd.isna(prob) or not isinstance(prob, (int, float)):
        return 0.0
    return max(0.0, min(1.0, float(prob)))

@app.get("/")
async def root():
    return {"message": "Fraud Detection API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_trained": is_trained,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/model/status")
async def model_status():
    global is_trained, model, feature_columns
    
    return {
        "is_trained": is_trained,
        "model_type": type(model).__name__ if model else None,
        "feature_count": len(feature_columns),
        "features": feature_columns,
        "timestamp": datetime.now().isoformat()
    }

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create additional features from raw transaction data"""
    
    # Convert timestamp to datetime if it's a string
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour_of_day'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
    
    # Amount-based features
    df['amount_log'] = np.log1p(df['amount'])
    df['amount_rounded'] = (df['amount'] % 1 == 0).astype(int)
    
    # Create amount categories
    df['amount_category'] = pd.cut(df['amount'], 
                                  bins=[0, 10, 50, 200, 1000, float('inf')], 
                                  labels=['very_low', 'low', 'medium', 'high', 'very_high'])
    
    # Time-based features
    if 'hour_of_day' in df.columns:
        df['is_night'] = ((df['hour_of_day'] >= 22) | (df['hour_of_day'] <= 6)).astype(int)
        df['is_business_hours'] = ((df['hour_of_day'] >= 9) & (df['hour_of_day'] <= 17)).astype(int)
    
    # Location features (simplified)
    df['is_high_risk_country'] = df['location_country'].isin([
        'Nigeria', 'Russia', 'China', 'Romania', 'Ukraine'
    ]).astype(int)
    
    # Payment method risk
    df['is_high_risk_payment'] = df['payment_method'].isin([
        'PayPal', 'Apple Pay', 'Google Pay'
    ]).astype(int)
    
    # Merchant category risk
    high_risk_categories = ['Online Shopping', 'Electronics', 'Gas Station']
    df['is_high_risk_category'] = df['merchant_category'].isin(high_risk_categories).astype(int)
    
    return df

def preprocess_data(df: pd.DataFrame, is_training: bool = False) -> pd.DataFrame:
    """Preprocess the data for model training/prediction"""
    global label_encoders, scaler, feature_columns
    
    # Engineer features
    df_processed = engineer_features(df.copy())
    
    # Categorical columns to encode
    categorical_columns = [
        'merchant_category', 'payment_method', 'device_type', 
        'location_country', 'amount_category'
    ]
    
    # Numerical columns to scale
    numerical_columns = [
        'amount', 'amount_log', 'latitude', 'longitude', 
        'hour_of_day', 'day_of_week'
    ]
    
    # Binary/engineered features
    binary_columns = [
        'amount_rounded', 'is_night', 'is_business_hours',
        'is_high_risk_country', 'is_high_risk_payment', 'is_high_risk_category'
    ]
    
    if is_training:
        # Fit label encoders
        for col in categorical_columns:
            if col in df_processed.columns:
                le = LabelEncoder()
                df_processed[col + '_encoded'] = le.fit_transform(df_processed[col].astype(str))
                label_encoders[col] = le
        
        # Fit scaler
        scaler = StandardScaler()
        if all(col in df_processed.columns for col in numerical_columns):
            df_processed[numerical_columns] = scaler.fit_transform(df_processed[numerical_columns])
    
    else:
        # Transform using fitted encoders
        for col in categorical_columns:
            if col in df_processed.columns and col in label_encoders:
                le = label_encoders[col]
                # Handle unseen categories
                df_processed[col + '_encoded'] = df_processed[col].astype(str).apply(
                    lambda x: le.transform([x])[0] if x in le.classes_ else -1
                )
        
        # Transform using fitted scaler
        if scaler is not None and all(col in df_processed.columns for col in numerical_columns):
            df_processed[numerical_columns] = scaler.transform(df_processed[numerical_columns])
    
    # Select final features
    encoded_categoricals = [col + '_encoded' for col in categorical_columns 
                          if col in df_processed.columns]
    
    feature_columns = numerical_columns + encoded_categoricals + binary_columns
    feature_columns = [col for col in feature_columns if col in df_processed.columns]
    
    return df_processed[feature_columns]

@app.post("/train")
async def train_model(request: TrainingRequest):
    """Train the fraud detection model"""
    global model, is_trained, feature_columns
    
    try:
        logger.info(f"Starting model training with {len(request.transactions)} transactions")
        
        # Convert to DataFrame
        transactions_data = [t.dict() for t in request.transactions]
        df = pd.DataFrame(transactions_data)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No training data provided")
        
        logger.info(f"Data loaded: {len(df)} transactions")
        logger.info(f"Fraud rate: {df['is_fraudulent'].mean():.3f}")
        
        # Preprocess data
        X = preprocess_data(df, is_training=True)
        y = df['is_fraudulent']
        
        logger.info(f"Features engineered: {X.shape[1]} features")
        logger.info(f"Feature columns: {feature_columns}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'  # Handle class imbalance
        )
        
        logger.info("Training Random Forest model...")
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        report = classification_report(y_test, y_pred, output_dict=True)
        
        # Feature importance
        feature_importance = dict(zip(feature_columns, model.feature_importances_))
        
        # Save model and preprocessors
        os.makedirs('models', exist_ok=True)
        joblib.dump(model, 'models/fraud_model.pkl')
        joblib.dump(label_encoders, 'models/label_encoders.pkl')
        joblib.dump(scaler, 'models/scaler.pkl')
        joblib.dump(feature_columns, 'models/feature_columns.pkl')
        
        is_trained = True
        
        logger.info("Model training completed successfully")
        
        return {
            "status": "success",
            "message": "Model trained successfully",
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "features_count": len(feature_columns),
            "model_accuracy": report['accuracy'],
            "fraud_precision": report['True']['precision'] if 'True' in report else 0,
            "fraud_recall": report['True']['recall'] if 'True' in report else 0,
            "fraud_f1": report['True']['f1-score'] if 'True' in report else 0,
            "feature_importance": dict(sorted(feature_importance.items(), 
                                            key=lambda x: x[1], reverse=True)[:10])
        }
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/predict", response_model=FraudPrediction)
async def predict_fraud(transaction: TransactionFeatures):
    """Predict fraud for a single transaction"""
    global model, is_trained
    
    if not is_trained or model is None:
        # Fallback prediction logic
        return get_fallback_prediction(transaction)
    
    try:
        # Convert to DataFrame
        df = pd.DataFrame([transaction.dict()])
        
        # Preprocess
        X = preprocess_data(df, is_training=False)
        
        # Make prediction
        fraud_probability = model.predict_proba(X)[0, 1]
        
        # FIXED: Normalize probability first, then calculate risk score properly
        fraud_probability = validate_and_normalize_probability(fraud_probability)
        is_fraud = fraud_probability > 0.5
        
        # FIXED: Calculate risk score as direct percentage (0-100)
        risk_score = validate_and_normalize_risk_score(fraud_probability * 100)
        
        # Generate fraud reason based on feature importance
        fraud_reason = generate_fraud_reason(transaction, fraud_probability)
        
        # Get feature importance for this prediction
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            for i, feature in enumerate(feature_columns):
                if i < len(model.feature_importances_):
                    feature_importance[feature] = float(model.feature_importances_[i])
        
        return FraudPrediction(
            is_fraud=is_fraud,
            fraud_probability=fraud_probability,
            risk_score=risk_score,
            fraud_reason=fraud_reason,
            feature_importance=feature_importance
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        # Return fallback prediction on error
        return get_fallback_prediction(transaction)

def get_fallback_prediction(transaction: TransactionFeatures) -> FraudPrediction:
    """Fallback rule-based prediction when ML model is not available"""
    
    risk_factors = 0
    reasons = []
    
    # High amount
    if transaction.amount > 2000:
        risk_factors += 3
        reasons.append("high_amount")
    elif transaction.amount > 1000:
        risk_factors += 2
        reasons.append("elevated_amount")
    
    # Very small amounts (card testing)
    if transaction.amount < 5:
        risk_factors += 2
        reasons.append("micro_transaction")
    
    # Unusual hours
    if transaction.hour_of_day < 6 or transaction.hour_of_day > 23:
        risk_factors += 2
        reasons.append("unusual_hours")
    
    # High-risk categories
    if transaction.merchant_category in ['Online Shopping', 'Electronics', 'Gas Station']:
        risk_factors += 1
        reasons.append("high_risk_category")
    
    # High-risk payment methods
    if transaction.payment_method in ['PayPal', 'Apple Pay', 'Google Pay']:
        risk_factors += 1
        reasons.append("high_risk_payment")
    
    # High-risk countries
    if transaction.location_country in ['Nigeria', 'Russia', 'China', 'Romania']:
        risk_factors += 2
        reasons.append("high_risk_location")
    
    # FIXED: Calculate probability properly (max 10 risk factors)
    max_risk_factors = 10
    fraud_probability = min(0.95, (risk_factors / max_risk_factors) * 0.8 + 0.05)
    fraud_probability = validate_and_normalize_probability(fraud_probability)
    
    is_fraud = fraud_probability > 0.5
    
    # FIXED: Risk score is simply probability * 100, properly capped
    risk_score = validate_and_normalize_risk_score(fraud_probability * 100)
    
    fraud_reason = "rule_based: " + ", ".join(reasons) if reasons else "low_risk_profile"
    
    return FraudPrediction(
        is_fraud=is_fraud,
        fraud_probability=fraud_probability,
        risk_score=risk_score,
        fraud_reason=fraud_reason,
        feature_importance={}
    )

def generate_fraud_reason(transaction: TransactionFeatures, fraud_probability: float) -> str:
    """Generate human-readable fraud reason"""
    
    if fraud_probability < 0.3:
        return "low_risk_transaction"
    elif fraud_probability < 0.5:
        return "moderate_risk_detected"
    elif fraud_probability < 0.7:
        return "high_risk_pattern_detected"
    else:
        reasons = []
        
        if transaction.amount > 1000:
            reasons.append("high_amount")
        if transaction.hour_of_day < 6 or transaction.hour_of_day > 22:
            reasons.append("unusual_time")
        if transaction.merchant_category in ['Online Shopping', 'Electronics']:
            reasons.append("high_risk_merchant")
        if transaction.payment_method in ['PayPal', 'Apple Pay', 'Google Pay']:
            reasons.append("digital_payment")
        
        return "ml_detected: " + ", ".join(reasons) if reasons else "suspicious_pattern"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)