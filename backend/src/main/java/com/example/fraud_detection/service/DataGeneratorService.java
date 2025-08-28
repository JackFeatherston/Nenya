package com.example.fraud_detection.service;

import com.example.fraud_detection.model.Transaction;
import com.example.fraud_detection.repository.TransactionRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javafaker.Faker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DataGeneratorService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private FraudDetectionService fraudDetectionService;
    
    private final Faker faker = new Faker();
    private final Random random = new Random();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
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
    
    // Real world cities with accurate coordinates
    private final List<CityLocation> worldCities = Arrays.asList(
        new CityLocation("New York", "United States", 40.7128, -74.0060),
        new CityLocation("Los Angeles", "United States", 34.0522, -118.2437),
        new CityLocation("Chicago", "United States", 41.8781, -87.6298),
        new CityLocation("London", "United Kingdom", 51.5074, -0.1278),
        new CityLocation("Paris", "France", 48.8566, 2.3522),
        new CityLocation("Berlin", "Germany", 52.5200, 13.4050),
        new CityLocation("Tokyo", "Japan", 35.6762, 139.6503),
        new CityLocation("Sydney", "Australia", -33.8688, 151.2093),
        new CityLocation("Mumbai", "India", 19.0760, 72.8777),
        new CityLocation("Delhi", "India", 28.7041, 77.1025),
        new CityLocation("São Paulo", "Brazil", -23.5505, -46.6333),
        new CityLocation("Rio de Janeiro", "Brazil", -22.9068, -43.1729),
        new CityLocation("Cairo", "Egypt", 30.0444, 31.2357),
        new CityLocation("Moscow", "Russia", 55.7558, 37.6173),
        new CityLocation("Beijing", "China", 39.9042, 116.4074),
        new CityLocation("Shanghai", "China", 31.2304, 121.4737),
        new CityLocation("Lagos", "Nigeria", 6.5244, 3.3792),
        new CityLocation("Mexico City", "Mexico", 19.4326, -99.1332),
        new CityLocation("Bangkok", "Thailand", 13.7563, 100.5018),
        new CityLocation("Buenos Aires", "Argentina", -34.6037, -58.3816),
        new CityLocation("Toronto", "Canada", 43.6532, -79.3832),
        new CityLocation("Vancouver", "Canada", 49.2827, -123.1207),
        new CityLocation("Madrid", "Spain", 40.4168, -3.7038),
        new CityLocation("Rome", "Italy", 41.9028, 12.4964),
        new CityLocation("Amsterdam", "Netherlands", 52.3676, 4.9041),
        new CityLocation("Stockholm", "Sweden", 59.3293, 18.0686),
        new CityLocation("Oslo", "Norway", 59.9139, 10.7522),
        new CityLocation("Copenhagen", "Denmark", 55.6761, 12.5683),
        new CityLocation("Vienna", "Austria", 48.2082, 16.3738),
        new CityLocation("Zurich", "Switzerland", 47.3769, 8.5417),
        new CityLocation("Dubai", "United Arab Emirates", 25.2048, 55.2708),
        new CityLocation("Istanbul", "Turkey", 41.0082, 28.9784),
        new CityLocation("Seoul", "South Korea", 37.5665, 126.9780),
        new CityLocation("Singapore", "Singapore", 1.3521, 103.8198),
        new CityLocation("Hong Kong", "China", 22.3193, 114.1694),
        new CityLocation("Johannesburg", "South Africa", -26.2041, 28.0473),
        new CityLocation("Cape Town", "South Africa", -33.9249, 18.4241),
        new CityLocation("Tel Aviv", "Israel", 32.0853, 34.7818),
        new CityLocation("Warsaw", "Poland", 52.2297, 21.0122),
        new CityLocation("Prague", "Czech Republic", 50.0755, 14.4378),
        new CityLocation("Budapest", "Hungary", 47.4979, 19.0402),
        new CityLocation("Athens", "Greece", 37.9755, 23.7348),
        new CityLocation("Lisbon", "Portugal", 38.7223, -9.1393),
        new CityLocation("Montreal", "Canada", 45.5017, -73.5673),
        new CityLocation("Miami", "United States", 25.7617, -80.1918),
        new CityLocation("San Francisco", "United States", 37.7749, -122.4194),
        new CityLocation("Seattle", "United States", 47.6062, -122.3321),
        new CityLocation("Boston", "United States", 42.3601, -71.0589),
        new CityLocation("Philadelphia", "United States", 39.9526, -75.1652),
        new CityLocation("Atlanta", "United States", 33.7490, -84.3880),
        new CityLocation("Houston", "United States", 29.7604, -95.3698),
        new CityLocation("Dallas", "United States", 32.7767, -96.7970),
        new CityLocation("Phoenix", "United States", 33.4484, -112.0740),
        new CityLocation("Las Vegas", "United States", 36.1699, -115.1398),
        new CityLocation("Denver", "United States", 39.7392, -104.9903),
        new CityLocation("Austin", "United States", 30.2672, -97.7431),
        new CityLocation("Nashville", "United States", 36.1627, -86.7816),
        new CityLocation("New Orleans", "United States", 29.9511, -90.0715),
        new CityLocation("Portland", "United States", 45.5152, -122.6784),
        new CityLocation("Melbourne", "Australia", -37.8136, 144.9631),
        new CityLocation("Brisbane", "Australia", -27.4698, 153.0251),
        new CityLocation("Perth", "Australia", -31.9505, 115.8605),
        new CityLocation("Adelaide", "Australia", -34.9285, 138.6007),
        new CityLocation("Wellington", "New Zealand", -41.2865, 174.7762),
        new CityLocation("Auckland", "New Zealand", -36.8485, 174.7633),
        new CityLocation("Bangalore", "India", 12.9716, 77.5946),
        new CityLocation("Chennai", "India", 13.0827, 80.2707),
        new CityLocation("Kolkata", "India", 22.5726, 88.3639),
        new CityLocation("Hyderabad", "India", 17.3850, 78.4867),
        new CityLocation("Pune", "India", 18.5204, 73.8567),
        new CityLocation("Jakarta", "Indonesia", -6.2088, 106.8456),
        new CityLocation("Manila", "Philippines", 14.5995, 120.9842),
        new CityLocation("Kuala Lumpur", "Malaysia", 3.1390, 101.6869),
        new CityLocation("Ho Chi Minh City", "Vietnam", 10.8231, 106.6297),
        new CityLocation("Hanoi", "Vietnam", 21.0285, 105.8542)
    );
    
    // Inner class for city locations
    private static class CityLocation {
        final String city;
        final String country;
        final double latitude;
        final double longitude;
        
        CityLocation(String city, String country, double latitude, double longitude) {
            this.city = city;
            this.country = country;
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }
    
    @Transactional
    public void generateSyntheticData(int totalTransactions) {
        if (totalTransactions <= 0) {
            throw new IllegalArgumentException("Total transactions must be positive");
        }
        
        if (totalTransactions > 100000) {
            throw new IllegalArgumentException("Cannot generate more than 100,000 transactions at once");
        }
        
        try {
            // Clear all existing data first and flush changes
            transactionRepository.deleteAll();
            transactionRepository.flush();
            
            List<Transaction> allTransactions = new ArrayList<>();
            
            // Generate transactions with realistic patterns (no hardcoded fraud logic)
            for (int i = 0; i < totalTransactions; i++) {
                Transaction transaction = generateRealisticTransaction();
                allTransactions.add(transaction);
            }
            
            // Save all transactions in batches
            int batchSize = 500;
            for (int i = 0; i < allTransactions.size(); i += batchSize) {
                int endIndex = Math.min(i + batchSize, allTransactions.size());
                List<Transaction> batch = allTransactions.subList(i, endIndex);
                transactionRepository.saveAll(batch);
                transactionRepository.flush();
            }
            
            // Now train the ML model with generated data if Python service is available
            try {
                trainMLModel();
            } catch (Exception e) {
                System.err.println("Warning: Could not train ML model - " + e.getMessage());
                System.err.println("Falling back to rule-based fraud detection");
            }
            
            // Update transactions with ML predictions
            updateTransactionsWithMLPredictions();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate synthetic data: " + e.getMessage(), e);
        }
    }
    
    private Transaction generateRealisticTransaction() {
        String transactionId = "TXN-" + faker.number().digits(12);
        String userId = "USER-" + faker.number().digits(8);
        String merchantName = faker.company().name();
        String merchantCategory = merchantCategories[random.nextInt(merchantCategories.length)];
        
        // Generate more realistic amounts based on merchant category
        BigDecimal amount = generateRealisticAmount(merchantCategory);
        String currency = "USD";
        
        // Generate realistic timestamps (more transactions during business hours)
        LocalDateTime timestamp = generateRealisticTimestamp();
        
        String paymentMethod = paymentMethods[random.nextInt(paymentMethods.length)];
        String cardLastFour = faker.number().digits(4);
        
        CityLocation cityLocation = getRandomCity();
        String locationCity = cityLocation.city;
        String locationCountry = cityLocation.country;
        
        String ipAddress = faker.internet().ipV4Address();
        String deviceType = deviceTypes[random.nextInt(deviceTypes.length)];
        
        // Don't set fraud status yet - will be determined by ML model
        // Set default risk score that will be updated by ML model
        BigDecimal riskScore = BigDecimal.valueOf(0.5).setScale(2, RoundingMode.HALF_UP);
        
        return new Transaction(
            transactionId, userId, merchantName, merchantCategory, amount, currency,
            timestamp, paymentMethod, cardLastFour, locationCity, locationCountry,
            BigDecimal.valueOf(cityLocation.latitude), BigDecimal.valueOf(cityLocation.longitude),
            ipAddress, deviceType, false, null, riskScore
        );
    }
    
    private BigDecimal generateRealisticAmount(String merchantCategory) {
        // Generate amounts based on realistic spending patterns for different categories
        double baseAmount;
        double variance;
        
        switch (merchantCategory) {
            case "Coffee Shop":
                baseAmount = 8.50;
                variance = 5.0;
                break;
            case "Fast Food":
                baseAmount = 15.0;
                variance = 8.0;
                break;
            case "Restaurant":
                baseAmount = 45.0;
                variance = 25.0;
                break;
            case "Grocery Store":
                baseAmount = 85.0;
                variance = 40.0;
                break;
            case "Gas Station":
                baseAmount = 55.0;
                variance = 20.0;
                break;
            case "Electronics":
                baseAmount = 350.0;
                variance = 400.0;
                break;
            case "Online Shopping":
                baseAmount = 125.0;
                variance = 200.0;
                break;
            case "Hotel":
                baseAmount = 220.0;
                variance = 150.0;
                break;
            case "Airline":
                baseAmount = 450.0;
                variance = 300.0;
                break;
            default:
                baseAmount = 75.0;
                variance = 50.0;
        }
        
        // Add some randomness but keep amounts realistic
        double randomAmount = Math.max(1.0, baseAmount + (random.nextGaussian() * variance));
        
        // Occasionally generate higher amounts for more variety
        if (random.nextDouble() < 0.1) {
            randomAmount *= (2 + random.nextDouble() * 3); // 2x to 5x higher
        }
        
        return BigDecimal.valueOf(randomAmount).setScale(2, RoundingMode.HALF_UP);
    }
    
    private LocalDateTime generateRealisticTimestamp() {
        // Generate timestamps with realistic patterns
        LocalDateTime baseTime = faker.date()
            .past(30, TimeUnit.DAYS)
            .toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
        
        // Adjust hour based on realistic shopping patterns
        int hour;
        double rand = random.nextDouble();
        
        if (rand < 0.4) {
            // 40% - Business hours (9 AM - 6 PM)
            hour = 9 + random.nextInt(9);
        } else if (rand < 0.7) {
            // 30% - Evening hours (6 PM - 10 PM)
            hour = 18 + random.nextInt(4);
        } else if (rand < 0.9) {
            // 20% - Morning hours (7 AM - 9 AM)
            hour = 7 + random.nextInt(2);
        } else {
            // 10% - Night hours (10 PM - 7 AM)
            hour = random.nextInt(24);
        }
        
        return baseTime.withHour(hour)
                     .withMinute(random.nextInt(60))
                     .withSecond(random.nextInt(60));
    }
    
    private CityLocation getRandomCity() {
        return worldCities.get(random.nextInt(worldCities.size()));
    }
    
    private void trainMLModel() {
        try {
            List<Transaction> allTransactions = transactionRepository.findAll();
            
            // Create initial training data with rule-based labels for bootstrapping
            List<TrainingTransaction> trainingData = new ArrayList<>();
            
            for (Transaction transaction : allTransactions) {
                // Use rule-based logic to create initial labels
                boolean isInitialFraud = determineInitialFraudStatus(transaction);
                
                TrainingTransaction trainingTx = new TrainingTransaction();
                trainingTx.transactionId = transaction.getTransactionId();
                trainingTx.userId = transaction.getUserId();
                trainingTx.merchantName = transaction.getMerchantName();
                trainingTx.merchantCategory = transaction.getMerchantCategory();
                trainingTx.amount = transaction.getAmount().doubleValue();
                trainingTx.currency = transaction.getCurrency();
                trainingTx.timestamp = transaction.getTimestamp().toString();
                trainingTx.paymentMethod = transaction.getPaymentMethod();
                trainingTx.cardLastFour = transaction.getCardLastFour();
                trainingTx.locationCity = transaction.getLocationCity();
                trainingTx.locationCountry = transaction.getLocationCountry();
                trainingTx.latitude = transaction.getLatitude().doubleValue();
                trainingTx.longitude = transaction.getLongitude().doubleValue();
                trainingTx.ipAddress = transaction.getIpAddress();
                trainingTx.deviceType = transaction.getDeviceType();
                trainingTx.isFraudulent = isInitialFraud;
                
                trainingData.add(trainingTx);
            }
            
            // Send training request to Python API
            fraudDetectionService.trainModel(trainingData);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to train ML model: " + e.getMessage(), e);
        }
    }
    
    private boolean determineInitialFraudStatus(Transaction transaction) {
        // Rule-based logic to create initial training labels
        // This creates a more sophisticated fraud pattern than the original hardcoded approach
        
        double amount = transaction.getAmount().doubleValue();
        int hour = transaction.getTimestamp().getHour();
        String category = transaction.getMerchantCategory();
        String paymentMethod = transaction.getPaymentMethod();
        
        int riskFactors = 0;
        
        // High amount transactions (but not always fraud)
        if (amount > 2000) riskFactors += 2;
        else if (amount > 1000) riskFactors += 1;
        
        // Very small amounts might be card testing
        if (amount < 5.0) riskFactors += 1;
        
        // Unusual hours
        if (hour < 6 || hour > 23) riskFactors += 1;
        
        // High-risk categories
        if (Arrays.asList("Online Shopping", "Electronics", "Gas Station").contains(category)) {
            riskFactors += 1;
        }
        
        // High-risk payment methods
        if (Arrays.asList("PayPal", "Apple Pay", "Google Pay").contains(paymentMethod)) {
            riskFactors += 1;
        }
        
        // Create realistic fraud rate (around 3-7%)
        double fraudProbability = Math.min(0.7, riskFactors * 0.15 + 0.02);
        
        return random.nextDouble() < fraudProbability;
    }
    
    private void updateTransactionsWithMLPredictions() {
        try {
            List<Transaction> allTransactions = transactionRepository.findAll();
            List<Transaction> updatedTransactions = new ArrayList<>();
            
            for (Transaction transaction : allTransactions) {
                try {
                    // Get ML prediction
                    FraudPrediction prediction = fraudDetectionService.predictFraud(transaction);
                    
                    // FIXED: Validate and normalize risk score before saving
                    double validatedRiskScore = validateRiskScore(prediction.riskScore);
                    double validatedProbability = validateProbability(prediction.fraudProbability);
                    
                    // Update transaction with validated ML results
                    transaction.setIsFraudulent(prediction.isFraud);
                    transaction.setRiskScore(BigDecimal.valueOf(validatedRiskScore)
                                        .setScale(2, RoundingMode.HALF_UP));
                    transaction.setFraudReason(prediction.fraudReason);
                    
                    // Log any corrections made
                    if (Math.abs(validatedRiskScore - prediction.riskScore) > 0.01) {
                        logger.warn("Risk score corrected for transaction {}: {} -> {}", 
                                transaction.getTransactionId(), 
                                prediction.riskScore, 
                                validatedRiskScore);
                    }
                    
                    updatedTransactions.add(transaction);
                    
                } catch (Exception e) {
                    System.err.println("Failed to get ML prediction for transaction " + 
                                    transaction.getTransactionId() + ": " + e.getMessage());
                    
                    // Set safe defaults if ML prediction fails
                    transaction.setIsFraudulent(false);
                    transaction.setRiskScore(BigDecimal.valueOf(25.0).setScale(2, RoundingMode.HALF_UP));
                    transaction.setFraudReason("prediction_failed");
                    
                    updatedTransactions.add(transaction);
                }
            }
            
            // Save updated transactions
            transactionRepository.saveAll(updatedTransactions);
            
        } catch (Exception e) {
            System.err.println("Failed to update transactions with ML predictions: " + e.getMessage());
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
    
    @Transactional
    public void clearAllData() {
        try {
            transactionRepository.deleteAll();
            transactionRepository.flush();
            
            // Verify data is cleared
            long remainingCount = transactionRepository.count();
            if (remainingCount > 0) {
                throw new RuntimeException("Failed to clear all data. " + remainingCount + " transactions remain.");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to clear data: " + e.getMessage(), e);
        }
    }
    
    // DTOs for communication with Python API
    public static class TrainingTransaction {
        @JsonProperty("transaction_id")
        public String transactionId;
        
        @JsonProperty("user_id")
        public String userId;
        
        @JsonProperty("merchant_name")
        public String merchantName;
        
        @JsonProperty("merchant_category")
        public String merchantCategory;
        
        public double amount;
        public String currency;
        public String timestamp;
        
        @JsonProperty("payment_method")
        public String paymentMethod;
        
        @JsonProperty("card_last_four")
        public String cardLastFour;
        
        @JsonProperty("location_city")
        public String locationCity;
        
        @JsonProperty("location_country")
        public String locationCountry;
        
        public double latitude;
        public double longitude;
        
        @JsonProperty("ip_address")
        public String ipAddress;
        
        @JsonProperty("device_type")
        public String deviceType;
        
        @JsonProperty("is_fraudulent")
        public boolean isFraudulent;
    }
    
    public static class FraudPrediction {
        @JsonProperty("is_fraud")
        public boolean isFraud;
        
        @JsonProperty("fraud_probability")
        public double fraudProbability;
        
        @JsonProperty("risk_score")
        public double riskScore;
        
        @JsonProperty("fraud_reason")
        public String fraudReason;
        
        @JsonProperty("feature_importance")
        public Map<String, Double> featureImportance;
    }
}