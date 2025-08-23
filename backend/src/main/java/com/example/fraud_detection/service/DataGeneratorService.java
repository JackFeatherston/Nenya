package com.example.fraud_detection.service;

import com.example.fraud_detection.model.Transaction;
import com.example.fraud_detection.repository.TransactionRepository;
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
            
            // Generate exactly the requested number of transactions
            // 95% legitimate, 5% fraudulent
            int fraudulentCount = (int) Math.round(totalTransactions * 0.05);
            int legitimateCount = totalTransactions - fraudulentCount;
            
            List<Transaction> allTransactions = new ArrayList<>();
            
            // Generate legitimate transactions
            for (int i = 0; i < legitimateCount; i++) {
                allTransactions.add(generateLegitimateTransaction());
            }
            
            // Generate fraudulent transactions
            for (int i = 0; i < fraudulentCount; i++) {
                allTransactions.add(generateFraudulentTransaction());
            }
            
            // Shuffle the list to mix legitimate and fraudulent transactions
            Collections.shuffle(allTransactions);
            
            // Save all transactions in batches to avoid memory issues
            int batchSize = 500;
            for (int i = 0; i < allTransactions.size(); i += batchSize) {
                int endIndex = Math.min(i + batchSize, allTransactions.size());
                List<Transaction> batch = allTransactions.subList(i, endIndex);
                transactionRepository.saveAll(batch);
                transactionRepository.flush(); // Ensure each batch is committed
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate synthetic data: " + e.getMessage(), e);
        }
    }
    
    private CityLocation getRandomCity() {
        return worldCities.get(random.nextInt(worldCities.size()));
    }
    
    private Transaction generateLegitimateTransaction() {
        String transactionId = "TXN-" + faker.number().digits(12);
        String userId = "USER-" + faker.number().digits(8);
        String merchantName = faker.company().name();
        String merchantCategory = merchantCategories[random.nextInt(merchantCategories.length)];
        
        // Legitimate transactions: reasonable amounts (1 to 500)
        double randomAmount = 1.0 + (random.nextDouble() * 499.0); // 1.0 to 500.0
        BigDecimal amount = BigDecimal.valueOf(randomAmount).setScale(2, RoundingMode.HALF_UP);
        String currency = "USD";
        
        LocalDateTime timestamp = faker.date()
            .past(30, TimeUnit.DAYS)
            .toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
        
        String paymentMethod = paymentMethods[random.nextInt(paymentMethods.length)];
        String cardLastFour = faker.number().digits(4);
        
        // Get a real city location for legitimate transactions
        CityLocation cityLocation = getRandomCity();
        String locationCity = cityLocation.city;
        String locationCountry = cityLocation.country;
        
        String ipAddress = faker.internet().ipV4Address();
        String deviceType = deviceTypes[random.nextInt(deviceTypes.length)];
        
        // Low risk score for legitimate transactions (0.0 to 0.3)
        double randomRisk = random.nextDouble() * 0.3;
        BigDecimal riskScore = BigDecimal.valueOf(randomRisk).setScale(2, RoundingMode.HALF_UP);
        
        return new Transaction(
            transactionId, userId, merchantName, merchantCategory, amount, currency,
            timestamp, paymentMethod, cardLastFour, locationCity, locationCountry,
            BigDecimal.valueOf(cityLocation.latitude), BigDecimal.valueOf(cityLocation.longitude),
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
            // High amount transactions (1000 to 10000)
            double randomAmount = 1000.0 + (random.nextDouble() * 9000.0);
            amount = BigDecimal.valueOf(randomAmount).setScale(2, RoundingMode.HALF_UP);
        } else {
            // Small amount transactions for testing stolen cards (0.01 to 5.0)
            double randomAmount = 0.01 + (random.nextDouble() * 4.99);
            amount = BigDecimal.valueOf(randomAmount).setScale(2, RoundingMode.HALF_UP);
        }
        
        String currency = "USD";
        
        LocalDateTime timestamp = faker.date()
            .past(30, TimeUnit.DAYS)
            .toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
        
        String paymentMethod = paymentMethods[random.nextInt(paymentMethods.length)];
        String cardLastFour = faker.number().digits(4);
        
        // FIXED: Always use real city locations, even for fraudulent transactions
        // For fraudulent transactions, we might bias towards certain high-risk locations
        // but they're still real places
        CityLocation cityLocation;
        if (random.nextDouble() < 0.3) {
            // 30% chance to use "high-risk" locations (but still real cities)
            List<CityLocation> highRiskCities = Arrays.asList(
                new CityLocation("Las Vegas", "United States", 36.1699, -115.1398),
                new CityLocation("Miami", "United States", 25.7617, -80.1918),
                new CityLocation("Dubai", "United Arab Emirates", 25.2048, 55.2708),
                new CityLocation("Moscow", "Russia", 55.7558, 37.6173),
                new CityLocation("Istanbul", "Turkey", 41.0082, 28.9784),
                new CityLocation("Bangkok", "Thailand", 13.7563, 100.5018),
                new CityLocation("Manila", "Philippines", 14.5995, 120.9842),
                new CityLocation("Jakarta", "Indonesia", -6.2088, 106.8456)
            );
            cityLocation = highRiskCities.get(random.nextInt(highRiskCities.size()));
        } else {
            // 70% chance to use any random city
            cityLocation = getRandomCity();
        }
        
        String locationCity = cityLocation.city;
        String locationCountry = cityLocation.country;
        
        String ipAddress = faker.internet().ipV4Address();
        String deviceType = deviceTypes[random.nextInt(deviceTypes.length)];
        
        String fraudReason = fraudReasons[random.nextInt(fraudReasons.length)];
        
        // High risk score for fraudulent transactions (0.7 to 1.0)
        double randomRisk = 0.7 + (random.nextDouble() * 0.3); // 0.7 to 1.0
        BigDecimal riskScore = BigDecimal.valueOf(randomRisk).setScale(2, RoundingMode.HALF_UP);
        
        return new Transaction(
            transactionId, userId, merchantName, merchantCategory, amount, currency,
            timestamp, paymentMethod, cardLastFour, locationCity, locationCountry,
            BigDecimal.valueOf(cityLocation.latitude), BigDecimal.valueOf(cityLocation.longitude),
            ipAddress, deviceType, true, fraudReason, riskScore
        );
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
}