// Add this method to your DataGeneratorService.java class

private void updateTransactionsWithMLPredictions() {
    try {
        List<Transaction> allTransactions = transactionRepository.findAll();
        List<Transaction> updatedTransactions = new ArrayList<>();
        
        for (Transaction transaction : allTransactions) {
            try {
                // Get ML prediction
                FraudPrediction prediction = fraudDetectionService.predictFraud(transaction);
                
                // Validate and normalize risk score before saving
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

