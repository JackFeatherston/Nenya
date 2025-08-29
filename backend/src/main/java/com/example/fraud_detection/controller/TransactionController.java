package com.example.fraud_detection.controller;

import com.example.fraud_detection.model.Transaction;
import com.example.fraud_detection.repository.TransactionRepository;
import com.example.fraud_detection.service.DataGeneratorService;
import com.example.fraud_detection.service.FraudDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for handling transaction-related operations.
 * Provides endpoints for transaction management, fraud detection, and analytics.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private DataGeneratorService dataGeneratorService;
    
    @Autowired
    private FraudDetectionService fraudDetectionService;
    
    /**
     * Retrieves all transactions ordered by timestamp descending.
     * @return List of all transactions
     */
    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllOrderByTimestampDesc();
    }
    
    /**
     * Retrieves only fraudulent transactions.
     * @return List of fraudulent transactions
     */
    @GetMapping("/transactions/fraudulent")
    public List<Transaction> getFraudulentTransactions() {
        return transactionRepository.findByIsFraudulent(true);
    }
    
    /**
     * Retrieves only legitimate transactions.
     * @return List of legitimate transactions
     */
    @GetMapping("/transactions/legitimate")
    public List<Transaction> getLegitimateTransactions() {
        return transactionRepository.findByIsFraudulent(false);
    }
    
    /**
     * Retrieves transaction statistics including ML model status.
     * @return Map containing transaction counts, fraud rate, and ML status
     */
    @GetMapping("/transactions/stats")
    public Map<String, Object> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        Long totalTransactions = transactionRepository.count();
        Long fraudulentCount = transactionRepository.countFraudulentTransactions();
        Long legitimateCount = transactionRepository.countLegitimateTransactions();
        
        stats.put("total", totalTransactions);
        stats.put("fraudulent", fraudulentCount);
        stats.put("legitimate", legitimateCount);
        stats.put("fraudRate", totalTransactions > 0 ? 
                  (fraudulentCount.doubleValue() / totalTransactions.doubleValue()) * 100 : 0);
        
        // Add ML status information
        stats.put("ml_available", fraudDetectionService.isApiAvailable());
        if (fraudDetectionService.isApiAvailable()) {
            try {
                Map<String, Object> modelStatus = fraudDetectionService.getModelStatus();
                stats.put("ml_model_trained", modelStatus.get("is_trained"));
                stats.put("ml_feature_count", modelStatus.get("feature_count"));
            } catch (Exception e) {
                stats.put("ml_status_error", e.getMessage());
            }
        }
        
        return stats;
    }
    
    /**
     * Generates synthetic transaction data with fraud detection.
     * @param count Number of transactions to generate (default: 1000)
     * @return Response with generation status and ML detection info
     */
    @PostMapping("/generate-data")
    public ResponseEntity<Map<String, String>> generateData(@RequestParam(defaultValue = "1000") int count) {
        try {
            dataGeneratorService.generateSyntheticData(count);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully generated " + count + " synthetic transactions with ML-based fraud detection");
            
            // Add ML status to response
            boolean mlAvailable = fraudDetectionService.isApiAvailable();
            response.put("ml_detection", mlAvailable ? "enabled" : "fallback_rules_used");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to generate data: " + e.getMessage());
            
            // Check if error is related to ML API
            if (e.getMessage().contains("fraud detection API")) {
                response.put("ml_status", "unavailable");
                response.put("suggestion", "Start the Python ML service at http://localhost:8000");
            }
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Clears all transaction data from the database.
     * @return Response indicating success or failure
     */
    @DeleteMapping("/transactions")
    public ResponseEntity<Map<String, String>> clearAllData() {
        try {
            dataGeneratorService.clearAllData();
            Map<String, String> response = new HashMap<>();
            response.put("message", "All transaction data cleared successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to clear data: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Retrieves a specific transaction by ID.
     * @param id Transaction ID
     * @return Transaction if found, 404 if not found
     */
    @GetMapping("/transactions/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return transactionRepository.findById(id)
                .map(transaction -> ResponseEntity.ok().body(transaction))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Re-analyzes a transaction using the ML API to update fraud detection results.
     * @param id Transaction ID to re-analyze
     * @return Updated fraud analysis results or error response
     */
    @PostMapping("/transactions/{id}/reanalyze")
    public ResponseEntity<Map<String, Object>> reanalyzeTransaction(@PathVariable Long id) {
        try {
            Transaction transaction = transactionRepository.findById(id)
                .orElse(null);
            
            if (transaction == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("error", "Transaction not found");
                return ResponseEntity.notFound().build();
            }
            
            if (!fraudDetectionService.isApiAvailable()) {
                Map<String, Object> response = new HashMap<>();
                response.put("error", "ML API is not available");
                return ResponseEntity.status(503).body(response);
            }
            
            // Get fresh ML prediction
            DataGeneratorService.FraudPrediction prediction = fraudDetectionService.predictFraud(transaction);
            
            // Validate and normalize risk score before saving
            double validatedRiskScore = validateRiskScore(prediction.riskScore);
            double validatedProbability = validateProbability(prediction.fraudProbability);
            
            // Update transaction with validated ML results
            transaction.setIsFraudulent(prediction.isFraud);
            transaction.setRiskScore(java.math.BigDecimal.valueOf(validatedRiskScore)
                                   .setScale(2, java.math.RoundingMode.HALF_UP));
            transaction.setFraudReason(prediction.fraudReason);
            
            transactionRepository.save(transaction);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Transaction re-analyzed successfully");
            response.put("fraud_probability", validatedProbability);
            response.put("is_fraud", prediction.isFraud);
            response.put("risk_score", validatedRiskScore);
            response.put("fraud_reason", prediction.fraudReason);
            
            // Include correction info if values were adjusted
            if (Math.abs(validatedRiskScore - prediction.riskScore) > 0.01) {
                response.put("risk_score_corrected", true);
                response.put("original_risk_score", prediction.riskScore);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to re-analyze transaction: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Validates and normalizes risk score to be between 0 and 100
     */
    private double validateRiskScore(double riskScore) {
        if (Double.isNaN(riskScore) || Double.isInfinite(riskScore)) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(100.0, riskScore));
    }
    
    /**
     * Validates and normalizes fraud probability to be between 0 and 1
     */
    private double validateProbability(double probability) {
        if (Double.isNaN(probability) || Double.isInfinite(probability)) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(1.0, probability));
    }
}