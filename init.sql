-- Initialize the fraud_detection database
-- This script will run when the PostgreSQL container starts for the first time

CREATE DATABASE fraud_detection;

-- Connect to the fraud_detection database
\c fraud_detection;

-- Create an index on the transactions table for better performance
-- Note: The table will be created by Hibernate, but we can add indexes here if needed
-- The actual table creation will happen when the Spring Boot app starts

-- You can add any additional database setup here
COMMENT ON DATABASE fraud_detection IS 'Database for fraud detection application with synthetic transaction data';