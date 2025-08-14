package com.example.frauddetection.repository;

import com.example.frauddetection.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByIsFraudulent(Boolean isFraudulent);
    
    List<Transaction> findByUserId(String userId);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.isFraudulent = true")
    Long countFraudulentTransactions();
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.isFraudulent = false")
    Long countLegitimateTransactions();
    
    @Query("SELECT t FROM Transaction t ORDER BY t.timestamp DESC")
    List<Transaction> findAllOrderByTimestampDesc();
}