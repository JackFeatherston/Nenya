package com.example.fraud_detection.service;

import com.example.fraud_detection.model.Transaction;
import com.example.fraud_detection.repository.TransactionRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javafaker.Faker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Service for generating synthetic transaction data and managing fraud detection.
 * Creates realistic transaction patterns and integrates with ML-based fraud detection.
 */
@Service
public class DataGeneratorService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private FraudDetectionService fraudDetectionService;
    
    private final Faker faker = new Faker();
    private final Random random = new Random();
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
    
    /**
     * Represents a city location with coordinates for realistic transaction generation.
     */
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
    
    /**
     * Generates synthetic transaction data with realistic patterns and ML-based fraud detection.
     * Requires ML API to be available for training and predictions. No fallback logic is used.
     * @param totalTransactions Number of transactions to generate (1-100,000)
     * @throws IllegalArgumentException if count is invalid
     * @throws RuntimeException if data generation fails or ML API is unavailable
     */
    @Transactional
    public void generateSyntheticData(int totalTransactions) {
        if (totalTransactions <= 0) {
            throw new IllegalArgumentException("Total transactions must be positive");
        }
        
        if (totalTransactions > 100000) {
            throw new IllegalArgumentException("Cannot generate more than 100,000 transactions at once");
        }
        
        try {
            // ML API must be available before starting
            if (!fraudDetectionService.isApiAvailable()) {
                throw new RuntimeException("ML API is not available. Data generation requires ML fraud detection and no fallback is available. " +
                    "Please start the Python ML service at http://localhost:8000 before generating data.");
            }
            
            System.out.println("Starting synthetic data generation with " + totalTransactions + " transactions...");
            
            // Clear all existing data first and flush changes
            transactionRepository.deleteAll();
            transactionRepository.flush();
            
            List<Transaction> allTransactions = new ArrayList<>();
            
            // Generate transactions with realistic patterns (no fraud logic - ML will determine)
            for (int i = 0; i < totalTransactions; i++) {
                Transaction transaction = generateRealisticTransaction();
                allTransactions.add(transaction);
            }
            
            System.out.println("Generated " + allTransactions.size() + " raw transactions. Saving to database...");
            
            // Save all transactions in batches
            int batchSize = 500;
            for (int i = 0; i < allTransactions.size(); i += batchSize) {
                int endIndex = Math.min(i + batchSize, allTransactions.size());
                List<Transaction> batch = allTransactions.subList(i, endIndex);
                transactionRepository.saveAll(batch);
                transactionRepository.flush();
            }
            
            System.out.println("Raw transactions saved. Starting ML model training...");
            
            // Train ML model with generated data - this MUST succeed
            trainMLModel();
            System.out.println("ML model training completed successfully.");
            
            // Verify model is trained before proceeding
            Map<String, Object> modelStatus = fraudDetectionService.getModelStatus();
            Boolean isTrained = (Boolean) modelStatus.get("is_trained");
            if (isTrained == null || !isTrained) {
                throw new RuntimeException("ML model training appeared to succeed but model is not in trained state. Cannot proceed with fraud detection.");
            }
            
            System.out.println("Applying ML fraud detection to all transactions...");
            
            // Update transactions with ML predictions - this MUST succeed
            updateTransactionsWithMLPredictions();
            
            System.out.println("Successfully completed synthetic data generation with ML fraud detection.");
            
        } catch (Exception e) {
            // Clean up on failure
            try {
                transactionRepository.deleteAll();
                transactionRepository.flush();
                System.err.println("Cleaned up partial data due to generation failure.");
            } catch (Exception cleanupEx) {
                System.err.println("Failed to clean up partial data: " + cleanupEx.getMessage());
            }
            throw new RuntimeException("Failed to generate synthetic data: " + e.getMessage(), e);
        }
    }
    
    /**
     * Generates a single realistic transaction with proper geographic and temporal patterns.
     * @return New transaction with realistic attributes
     */
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
    
    /**
     * Generates realistic transaction amounts based on merchant category patterns.
     * @param merchantCategory The type of merchant
     * @return Realistic transaction amount for the category
     */
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
    
    /**
     * Generates realistic timestamps with business hour patterns.
     * @return Timestamp with realistic temporal distribution
     */
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
    
    /**
     * Trains the ML model using generated transaction data with synthetic fraud labels.
     * Creates realistic fraud patterns for model training without rule-based logic.
     * @throws RuntimeException if model training fails
     */
    private void trainMLModel() {
        try {
            List<Transaction> allTransactions = transactionRepository.findAll();
            
            if (allTransactions.isEmpty()) {
                throw new RuntimeException("No transaction data available for ML model training");
            }
            
            // Create training data with synthetic fraud labels for realistic ML training
            List<TrainingTransaction> trainingData = new ArrayList<>();
            
            // Generate realistic fraud patterns for training (approximately 10% fraud rate)
            int fraudCount = 0;
            int targetFraudCount = (int) (allTransactions.size() * 0.10); // 10% fraud rate
            
            // Sort transactions to ensure consistent training patterns
            Collections.sort(allTransactions, (a, b) -> a.getTransactionId().compareTo(b.getTransactionId()));
            
            for (int i = 0; i < allTransactions.size(); i++) {
                Transaction transaction = allTransactions.get(i);
                
                // Create synthetic fraud labels with realistic patterns
                boolean isTrainingFraud = false;
                if (fraudCount < targetFraudCount) {
                    // Distribute fraud labels across different patterns for realistic training
                    double amount = transaction.getAmount().doubleValue();
                    int hour = transaction.getTimestamp().getHour();
                    String category = transaction.getMerchantCategory();
                    
                    // Create varied fraud patterns for better ML training
                    boolean highAmountPattern = amount > 1000 && (i % 7 == 0);
                    boolean nightTimePattern = (hour < 6 || hour > 22) && (i % 11 == 0);
                    boolean riskyCategoryPattern = Arrays.asList("Online Shopping", "Electronics", "Gas Station").contains(category) && (i % 13 == 0);
                    boolean randomPattern = (i % 17 == 0);
                    
                    if (highAmountPattern || nightTimePattern || riskyCategoryPattern || randomPattern) {
                        isTrainingFraud = true;
                        fraudCount++;
                    }
                }
                
                TrainingTransaction trainingTx = new TrainingTransaction();
                trainingTx.transactionId = transaction.getTransactionId();
                trainingTx.userId = transaction.getUserId();
                trainingTx.merchantName = transaction.getMerchantName();
                trainingTx.merchantCategory = transaction.getMerchantCategory();
                trainingTx.amount = transaction.getAmount().doubleValue();
                trainingTx.currency = transaction.getCurrency();
                trainingTx.timestamp = transaction.getTimestamp().toString() + ".000000";
                trainingTx.paymentMethod = transaction.getPaymentMethod();
                trainingTx.cardLastFour = transaction.getCardLastFour();
                trainingTx.locationCity = transaction.getLocationCity();
                trainingTx.locationCountry = transaction.getLocationCountry();
                trainingTx.latitude = transaction.getLatitude().doubleValue();
                trainingTx.longitude = transaction.getLongitude().doubleValue();
                trainingTx.ipAddress = transaction.getIpAddress();
                trainingTx.deviceType = transaction.getDeviceType();
                trainingTx.isFraudulent = isTrainingFraud;
                
                trainingData.add(trainingTx);
            }
            
            // Verify we have a reasonable fraud rate for training
            double actualFraudRate = (double) fraudCount / allTransactions.size();
            if (actualFraudRate < 0.05 || actualFraudRate > 0.15) {
                throw new RuntimeException(String.format("Generated training data has unrealistic fraud rate: %.2f%%. Expected ~10%%", actualFraudRate * 100));
            }
            
            // Send training request to Python API - this must succeed
            fraudDetectionService.trainModel(trainingData);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to train ML model: " + e.getMessage(), e);
        }
    }
    
    
    /**
     * Updates all transactions with ML-based fraud predictions.
     * This method requires the ML API to be available and the model to be trained.
     * No fallback logic is used - failures result in exceptions.
     * @throws RuntimeException if ML API is unavailable or predictions fail
     */
    private void updateTransactionsWithMLPredictions() {
        try {
            List<Transaction> allTransactions = transactionRepository.findAll();
            
            if (allTransactions.isEmpty()) {
                return; // No transactions to update
            }
            
            // Verify ML API is available before starting
            if (!fraudDetectionService.isApiAvailable()) {
                throw new RuntimeException("ML API is not available. Cannot update transactions with fraud predictions. Please ensure the Python ML service is running.");
            }
            
            List<Transaction> updatedTransactions = new ArrayList<>();
            int failedPredictions = 0;
            
            for (Transaction transaction : allTransactions) {
                try {
                    // Get ML prediction - this must succeed
                    FraudPrediction prediction = fraudDetectionService.predictFraud(transaction);
                    
                    // Validate ML prediction results
                    if (prediction == null) {
                        throw new RuntimeException("ML API returned null prediction for transaction: " + transaction.getTransactionId());
                    }
                    
                    // Validate and normalize values
                    double validatedRiskScore = validateRiskScore(prediction.riskScore);
                    double validatedProbability = validateProbability(prediction.fraudProbability);
                    
                    // Update transaction with validated ML results
                    transaction.setIsFraudulent(prediction.isFraud);
                    transaction.setRiskScore(BigDecimal.valueOf(validatedRiskScore)
                                        .setScale(2, RoundingMode.HALF_UP));
                    transaction.setFraudProbability(BigDecimal.valueOf(validatedProbability)
                                        .setScale(4, RoundingMode.HALF_UP));
                    transaction.setFraudReason(prediction.fraudReason != null ? prediction.fraudReason : "ml_prediction");
                    
                    updatedTransactions.add(transaction);
                    
                } catch (Exception e) {
                    failedPredictions++;
                    // Log the failure but continue with other transactions
                    System.err.println("Failed to get ML prediction for transaction " + transaction.getTransactionId() + ": " + e.getMessage());
                    
                    // If too many predictions fail, abort the entire process
                    if (failedPredictions > allTransactions.size() * 0.1) { // More than 10% failures
                        throw new RuntimeException("Too many ML predictions failed (" + failedPredictions + "/" + allTransactions.size() + "). ML service may be unstable. Aborting fraud detection.");
                    }
                    
                    // For individual failures, skip this transaction rather than using fallback
                    continue;
                }
            }
            
            // Verify we got predictions for most transactions
            if (updatedTransactions.size() < allTransactions.size() * 0.9) {
                throw new RuntimeException("Only got ML predictions for " + updatedTransactions.size() + "/" + allTransactions.size() + " transactions. This is insufficient for reliable fraud detection.");
            }
            
            // Save successfully updated transactions
            if (!updatedTransactions.isEmpty()) {
                transactionRepository.saveAll(updatedTransactions);
                System.out.println("Successfully updated " + updatedTransactions.size() + " transactions with ML fraud predictions.");
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to update transactions with ML predictions: " + e.getMessage(), e);
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
    
    
    /**
     * Clears all transaction data from the database.
     * @throws RuntimeException if data clearing fails
     */
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
        
        // Default constructor
        public FraudPrediction() {}
        
        // Constructor for fallback cases
        public FraudPrediction(boolean isFraud, double fraudProbability, double riskScore, String fraudReason) {
            this.isFraud = isFraud;
            this.fraudProbability = fraudProbability;
            this.riskScore = riskScore;
            this.fraudReason = fraudReason;
            this.featureImportance = new HashMap<>();
        }
    }
}