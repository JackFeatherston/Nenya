-- Initialize the fraud_detection database
-- Note: Database is already created by Docker Compose POSTGRES_DB env var
-- This script runs after database creation

-- Connect to the fraud_detection database (already exists)
\c fraud_detection;

-- Create indexes for better performance (these will be applied after Hibernate creates tables)
-- These commands will run but may fail initially since tables don't exist yet - that's OK

-- Add any additional database setup here if needed
COMMENT ON DATABASE fraud_detection IS 'Database for fraud detection application with synthetic transaction data';

-- You could add stored procedures, functions, or other database objects here