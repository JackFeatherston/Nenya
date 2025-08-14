package com.example.frauddetection.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "transaction_id", unique = true, nullable = false)
    private String transactionId;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "merchant_name", nullable = false)
    private String merchantName;
    
    @Column(name = "merchant_category", nullable = false)
    private String merchantCategory;
    
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "currency", nullable = false)
    private String currency;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;
    
    @Column(name = "card_last_four")
    private String cardLastFour;
    
    @Column(name = "location_city")
    private String locationCity;
    
    @Column(name = "location_country")
    private String locationCountry;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "device_type")
    private String deviceType;
    
    @Column(name = "is_fraudulent", nullable = false)
    private Boolean isFraudulent;
    
    @Column(name = "fraud_reason")
    private String fraudReason;
    
    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;
    
    // Constructors
    public Transaction() {}
    
    public Transaction(String transactionId, String userId, String merchantName, 
                      String merchantCategory, BigDecimal amount, String currency,
                      LocalDateTime timestamp, String paymentMethod, String cardLastFour,
                      String locationCity, String locationCountry, String ipAddress,
                      String deviceType, Boolean isFraudulent, String fraudReason,
                      BigDecimal riskScore) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.merchantName = merchantName;
        this.merchantCategory = merchantCategory;
        this.amount = amount;
        this.currency = currency;
        this.timestamp = timestamp;
        this.paymentMethod = paymentMethod;
        this.cardLastFour = cardLastFour;
        this.locationCity = locationCity;
        this.locationCountry = locationCountry;
        this.ipAddress = ipAddress;
        this.deviceType = deviceType;
        this.isFraudulent = isFraudulent;
        this.fraudReason = fraudReason;
        this.riskScore = riskScore;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
    
    public String getMerchantCategory() { return merchantCategory; }
    public void setMerchantCategory(String merchantCategory) { this.merchantCategory = merchantCategory; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getCardLastFour() { return cardLastFour; }
    public void setCardLastFour(String cardLastFour) { this.cardLastFour = cardLastFour; }
    
    public String getLocationCity() { return locationCity; }
    public void setLocationCity(String locationCity) { this.locationCity = locationCity; }
    
    public String getLocationCountry() { return locationCountry; }
    public void setLocationCountry(String locationCountry) { this.locationCountry = locationCountry; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }
    
    public Boolean getIsFraudulent() { return isFraudulent; }
    public void setIsFraudulent(Boolean isFraudulent) { this.isFraudulent = isFraudulent; }
    
    public String getFraudReason() { return fraudReason; }
    public void setFraudReason(String fraudReason) { this.fraudReason = fraudReason; }
    
    public BigDecimal getRiskScore() { return riskScore; }
    public void setRiskScore(BigDecimal riskScore) { this.riskScore = riskScore; }
}