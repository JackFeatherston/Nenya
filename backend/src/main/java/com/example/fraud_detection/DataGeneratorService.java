package com.example.frauddetection.service;

import com.example.frauddetection.model.Transaction;
import com.example.frauddetection.repository.TransactionRepository;
import com.github.javafaker.Faker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DataGeneratorService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    private final Faker faker = new Faker();
    private final Random random = new Random();
    
    private final String[] merchantCategories = {
        "Grocery Store", "Gas Station", "Restaurant", "Retail", "Online Shopping",
        "Electronics", "Pharmacy", "Department Store", "Coffee Shop", "Fast Food",
        "Hotel", "Car Rental", "Airline", "Subscription Service", "Utility"
    };
    
    private final String[] paymentMethods = {
        "Credit Card", "Debit Card", "PayPal", "Apple Pay", "Google Pay", "Bank Transfer"
    };
    
    private final String[] deviceTypes = {
        "Mobile", "Desktop", "Tablet", "Smart TV", "Wearable"
    };
    
    private final String[] fraudReasons = {
        "Unusual spending pattern", "High-risk location", "Multiple rapid transactions",
        "Suspicious device", "Compromised card", "Identity theft", "Account takeover"
    };
    
    public void generateSyntheticData(int totalTransactions) {
        List<Transaction> transactions = new ArrayList<>();
        
        // Generate mostly legitimate transactions (95%) and some fraudulent ones (5%)
        int fraudulentCount = (int) (totalTransactions * 0.05);
        int legitimateCount = totalTransactions - fraudulentCount;
        
        // Generate legitimate transactions
        for (int i = 0; i < legitimateCount; i++) {
            transactions.add(generateLegitimateTransaction());
        }
        
        // Generate fraudulent transactions
        for (int i = 0; i < fraudulentCount; i++) {
            transactions.add(generateFraudulentTransaction());
        }
        
        // Shuffle to mix legitimate and fraudulent transactions
        Collections.shuffle(transactions);
        
        // Save all transactions
        transactionRepository.saveAll(transactions);
    }
    
    private Transaction generateLegitimateTransaction() {
        String transactionId = "TXN-" + faker.number().digits(12);
        String userId = "USER-" + faker.number().digits(8);
        String merchantName = faker.company().name();
        String merchantCategory = merchantCategories[random.nextInt(merchantCategories.length)];
        
        // Legitimate transactions: reasonable amounts
        BigDecimal amount = BigDecimal.valueOf(faker.number().randomDouble(2, 1, 500));
        String currency = "USD";
        
        LocalDateTime timestamp = faker.date()
            .past(30, TimeUnit.DAYS)
            .toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
        
        String paymentMethod = paymentMethods[random.nextInt(paymentMethods.length)];
        String cardLastFour = faker.number().digits(4);
        String locationCity = faker.address().city();
        String locationCountry = faker.address().country();
        String ipAddress = faker.internet().ipV4Address();
        String deviceType = deviceTypes[random.nextInt(deviceTypes.length)];
        
        // Low risk score for legitimate transactions
        BigDecimal riskScore = BigDecimal.valueOf(faker.number().randomDouble(2, 0.0, 0.3));
        
        return new Transaction(
            transactionId, userId, merchantName, merchantCategory, amount, currency,
            timestamp, paymentMethod, cardLastFour, locationCity, locationCountry,
            ipAddress, deviceType, false, null, riskScore
        );
    }
    
    private Transaction generateFraudulentTransaction() {
        String transactionId = "TXN-" + faker.number().digits(12);
        String userId = "USER-" + faker.number().digits(8);
        String merchantName = faker.company().name();
        String merchantCategory = merchantCategories[random.nextInt(merchantCategories.length)];
        
        // Fraudulent transactions: often higher amounts or suspicious patterns
        BigDecimal amount;
        if (random.nextDouble() < 0.6) {
            // High amount transactions
            amount = BigDecimal.valueOf(faker.number().randomDouble(2, 1000, 10000));
        } else {
            // Small amount transactions (testing stolen cards)
            amount = BigDecimal.valueOf(faker.number().randomDouble(2, 0.01, 5.0));
        }
        
        String currency = "USD";
        
        LocalDateTime timestamp = faker.date()
            .past(30, TimeUnit.DAYS)
            .toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
        
        String paymentMethod = paymentMethods[random.nextInt(paymentMethods.length)];
        String cardLastFour = faker.number().digits(4);
        
        // Sometimes use suspicious locations
        String locationCity, locationCountry;
        if (random.nextDouble() < 0.3) {
            // High-risk countries
            String[] highRiskCountries = {"Unknown", "Tor Network", "VPN", "Proxy"};
            locationCountry = highRiskCountries[random.nextInt(highRiskCountries.length)];
            locationCity = "Unknown";
        } else {
            locationCity = faker.address().city();
            locationCountry = faker.address().country();
        }
        
        String ipAddress = faker.internet().ipV4Address();
        String deviceType = deviceTypes[random.nextInt(deviceTypes.length)];
        
        String fraudReason = fraudReasons[random.nextInt(fraudReasons.length)];
        
        // High risk score for fraudulent transactions
        BigDecimal riskScore = BigDecimal.valueOf(faker.number().randomDouble(2, 0.7, 1.0));
        
        return new Transaction(
            transactionId, userId, merchantName, merchantCategory, amount, currency,
            timestamp, paymentMethod, cardLastFour, locationCity, locationCountry,
            ipAddress, deviceType, true, fraudReason, riskScore
        );
    }
    
    public void clearAllData() {
        transactionRepository.deleteAll();
    }
}