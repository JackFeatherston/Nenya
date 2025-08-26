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
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Model training completed successfully");
                System.out.println("Training result: " + response.getBody());
            } else {
                throw new RuntimeException("Failed to train model: " + response.getBody());
            }
            
        } catch (ResourceAccessException e) {
            throw new RuntimeException("Cannot connect to fraud detection API at " + fraudApiUrl + 
                                     ". Make sure the Python service is running.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to train model: " + e.getMessage(), e);
        }
    }
    
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
                                     ". Using fallback fraud detection.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get fraud prediction: " + e.getMessage(), e);
        }
    }
    
    public boolean isApiAvailable() {
        try {
            String url = fraudApiUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
    
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
    
    // DTO for sending transaction features to Python API
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
    }
}