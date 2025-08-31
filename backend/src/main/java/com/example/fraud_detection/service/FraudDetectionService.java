package com.example.fraud_detection.service;

import com.example.fraud_detection.model.Transaction;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for integrating with the Python ML fraud detection API.
 * Handles model training, fraud prediction, and API health checking.
 */
@Service
public class FraudDetectionService {
    
    @Value("${fraud.detection.api.url:http://localhost:8000}")
    private String fraudApiUrl;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public FraudDetectionService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Trains the ML fraud detection model with provided transaction data.
     * @param trainingData List of transactions with fraud labels for training
     * @throws RuntimeException if training fails or API is unavailable
     */
    public void trainModel(List<DataGeneratorService.TrainingTransaction> trainingData) {
        try {
            String url = fraudApiUrl + "/train";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("transactions", trainingData);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, request, Map.class
            );
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to train model: " + response.getBody());
            }
            
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Cannot connect to fraud detection API at " + fraudApiUrl + 
                                     ". Make sure the Python service is running.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to train model: " + e.getMessage(), e);
        }
    }
    
    /**
     * Predicts fraud for a single transaction using the ML model.
     * @param transaction Transaction to analyze
     * @return Fraud prediction with probability, risk score, and reasoning
     * @throws RuntimeException if prediction fails or API is unavailable
     */
    public DataGeneratorService.FraudPrediction predictFraud(Transaction transaction) {
        try {
            String url = fraudApiUrl + "/predict";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create transaction features for prediction
            TransactionFeatures features = new TransactionFeatures();
            features.amount = transaction.getAmount().doubleValue();
            features.merchantCategory = transaction.getMerchantCategory();
            features.paymentMethod = transaction.getPaymentMethod();
            features.deviceType = transaction.getDeviceType();
            features.locationCountry = transaction.getLocationCountry();
            features.hourOfDay = transaction.getTimestamp().getHour();
            features.dayOfWeek = transaction.getTimestamp().getDayOfWeek().getValue();
            features.latitude = transaction.getLatitude().doubleValue();
            features.longitude = transaction.getLongitude().doubleValue();
            features.userId = transaction.getUserId();
            features.merchantName = transaction.getMerchantName();
            features.timestamp = transaction.getTimestamp().toString() + ".000000";
            
            HttpEntity<TransactionFeatures> request = new HttpEntity<>(features, headers);
            
            ResponseEntity<DataGeneratorService.FraudPrediction> response = restTemplate.exchange(
                url, HttpMethod.POST, request, DataGeneratorService.FraudPrediction.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to get fraud prediction: " + response.getStatusCode());
            }
            
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Cannot connect to fraud detection API at " + fraudApiUrl + 
                                     ". ML fraud detection is required and no fallback is available. Please ensure the Python ML service is running.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get fraud prediction: " + e.getMessage(), e);
        }
    }
    
    /**
     * Checks if the fraud detection API is available and responding.
     * @return true if API is healthy, false otherwise
     */
    public boolean isApiAvailable() {
        try {
            String url = fraudApiUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Retrieves the current status of the ML model from the API.
     * @return Map containing model training status and feature information
     */
    public Map<String, Object> getModelStatus() {
        try {
            String url = fraudApiUrl + "/model/status";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else {
                throw new RuntimeException("Failed to get model status");
            }
        } catch (ResourceAccessException e) {
            Map<String, Object> status = new HashMap<>();
            status.put("error", "Cannot connect to fraud detection API");
            status.put("api_url", fraudApiUrl);
            return status;
        } catch (Exception e) {
            Map<String, Object> status = new HashMap<>();
            status.put("error", "Failed to get model status: " + e.getMessage());
            return status;
        }
    }
    
    /**
     * Validates that the ML model is ready for fraud detection.
     * Performs comprehensive checks on model availability and training status.
     * @throws RuntimeException if model is not ready for predictions
     */
    public void validateModelReadiness() {
        // Check API availability first
        if (!isApiAvailable()) {
            throw new RuntimeException("ML API is not available at " + fraudApiUrl + 
                ". Please ensure the Python ML service is running before attempting fraud detection.");
        }
        
        // Get detailed model status
        Map<String, Object> modelStatus = getModelStatus();
        
        // Check for connection errors
        if (modelStatus.containsKey("error")) {
            throw new RuntimeException("ML API error: " + modelStatus.get("error"));
        }
        
        // Validate model is trained
        Boolean isTrained = (Boolean) modelStatus.get("is_trained");
        if (isTrained == null || !isTrained) {
            throw new RuntimeException("ML model is not trained. Please train the model first before generating data or making predictions.");
        }
        
        // Validate model has features
        Object featureCount = modelStatus.get("feature_count");
        if (featureCount == null || ((Number) featureCount).intValue() < 5) {
            throw new RuntimeException("ML model has insufficient features (" + featureCount + "). Model may not be properly trained.");
        }
        
        // Validate model type
        Object modelType = modelStatus.get("model_type");
        if (modelType == null || !modelType.toString().contains("RandomForest")) {
            throw new RuntimeException("Expected RandomForest model but found: " + modelType + ". Model may not be properly initialized.");
        }
        
        System.out.println("ML model validation passed: " + 
            "trained=" + isTrained + 
            ", features=" + featureCount + 
            ", type=" + modelType);
    }
    
    /**
     * Checks if the ML model is ready for making predictions.
     * @return true if model is trained and ready, false otherwise
     */
    public boolean isModelReady() {
        try {
            validateModelReadiness();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Data Transfer Object for sending transaction features to the Python ML API.
     * Uses Jackson annotations for proper JSON serialization.
     */
    public static class TransactionFeatures {
        public double amount;
        
        @JsonProperty("merchant_category")
        public String merchantCategory;
        
        @JsonProperty("payment_method")
        public String paymentMethod;
        
        @JsonProperty("device_type")
        public String deviceType;
        
        @JsonProperty("location_country")
        public String locationCountry;
        
        @JsonProperty("hour_of_day")
        public int hourOfDay;
        
        @JsonProperty("day_of_week")
        public int dayOfWeek;
        
        public double latitude;
        public double longitude;
        
        @JsonProperty("user_id")
        public String userId;
        
        @JsonProperty("merchant_name")
        public String merchantName;
        
        public String timestamp;
    }
}