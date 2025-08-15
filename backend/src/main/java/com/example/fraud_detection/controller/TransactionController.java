package com.example.fraud_detection.controller;

import com.example.fraud_detection.model.Transaction;
import com.example.fraud_detection.repository.TransactionRepository;
import com.example.fraud_detection.service.DataGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private DataGeneratorService dataGeneratorService;
    
    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllOrderByTimestampDesc();
    }
    
    @GetMapping("/transactions/fraudulent")
    public List<Transaction> getFraudulentTransactions() {
        return transactionRepository.findByIsFraudulent(true);
    }
    
    @GetMapping("/transactions/legitimate")
    public List<Transaction> getLegitimateTransactions() {
        return transactionRepository.findByIsFraudulent(false);
    }
    
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
        
        return stats;
    }
    
    @PostMapping("/generate-data")
    public ResponseEntity<Map<String, String>> generateData(@RequestParam(defaultValue = "1000") int count) {
        try {
            dataGeneratorService.generateSyntheticData(count);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully generated " + count + " synthetic transactions");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to generate data: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
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
    
    @GetMapping("/transactions/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return transactionRepository.findById(id)
                .map(transaction -> ResponseEntity.ok().body(transaction))
                .orElse(ResponseEntity.notFound().build());
    }
}