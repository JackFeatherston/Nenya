package com.example.fraud_detection.controller;

import com.example.fraud_detection.service.FraudDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for ML fraud detection system monitoring and health checks.
 * Provides endpoints to check ML API status and model health.
 */
@RestController
@RequestMapping("/api/ml")
@CrossOrigin(origins = "http://localhost:3000")
public class MLController {
    
    @Autowired
    private FraudDetectionService fraudDetectionService;
    
    /**
     * Retrieves the current status of the ML fraud detection system.
     * @return ML system status including API availability and model information
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMLStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            boolean apiAvailable = fraudDetectionService.isApiAvailable();
            status.put("api_available", apiAvailable);
            
            if (apiAvailable) {
                Map<String, Object> modelStatus = fraudDetectionService.getModelStatus();
                status.put("model_status", modelStatus);
                status.put("status", "healthy");
            } else {
                status.put("status", "api_unavailable");
                status.put("message", "Python fraud detection API is not available");
            }
            
        } catch (Exception e) {
            status.put("status", "error");
            status.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(status);
    }
    
    /**
     * Performs a health check on the ML fraud detection API.
     * @return Health status with timestamp, returns 503 if API is unavailable
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        boolean apiAvailable = fraudDetectionService.isApiAvailable();
        health.put("ml_api_available", apiAvailable);
        health.put("timestamp", java.time.LocalDateTime.now().toString());
        
        if (apiAvailable) {
            health.put("status", "healthy");
            return ResponseEntity.ok(health);
        } else {
            health.put("status", "degraded");
            health.put("message", "ML API unavailable - using fallback detection");
            return ResponseEntity.status(503).body(health);
        }
    }
}