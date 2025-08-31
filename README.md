# Nenya 
A robust fraud detection engine with geographic visualization, categorial and numerical analytics, and real-time risk assessment. <br/><br/>

Nenya is a multi-service fraud detection application featuring a Spring Boot backend, FastAPI machine learning 
service using Scikit-learn, and a Next.js frontend with D3.js and Chart.js visualizations. The application utilizes 
Java Faker libraries to generate synthetic data that models real world credit card transactions, loads the data into 
a Postgres database simulating a ledger database, trains Random Forest models for fraud detection, and provides 
interactive geographic visualization of fraud patterns along with relevant insights and analytics. Click the 
shuffle button to generate a sample size of 
1000 simulated transactions and get calculated insights that real world companies utilize in their own analytics. 
Click the delete button to clear the data. 

<img width="2559" height="1146" alt="Image" src="https://github.com/user-attachments/assets/32e8bfc7-5ed1-450f-8292-7044d71bf6f3" />

<img width="2560" height="824" alt="Image" src="https://github.com/user-attachments/assets/fe2e4a1f-d89e-4576-ba80-4a0f5c313f8e" />

<img width="2560" height="879" alt="Image" src="https://github.com/user-attachments/assets/05df8e27-9f2b-4a6c-8b2c-f9a998e70356" />


## Features 
- **Machine Learning Fraud Detection** using Scikit-learns's Random Forest classifier with feature engineering
- **Real-time Risk Scoring** and fraud probability calculations determing from the trained model
- **Geographic Visualization** using D3.js for interactive fraud pattern mapping
- **Synthetic Data Generation** using Java Faker to create realistic transaction patterns 
- **Multi-service Architecture** with a Java backend, Python ML API, and Next.js frontend
- **Analytics** displaying information across pie charts, bar graphs, and info cards
- **Complete Dockerization** for easy deployment and development               

## System Architecture
<img width="1747" height="794" alt="Image" src="https://github.com/user-attachments/assets/0813ed58-5e14-4dc1-9bf4-dc5ca308332a" />

## Tech Stack
Frontend
- Next.js + TypeScript
- Tailwind CSS
- D3.js and Chart.js for data visualization

Backend
- Spring Boot Java API with JPA/Hibernate      
- PostgreSQL database for transaction persistence  
- LangChain for document processing and text splitting
- Springboot endpoints for transcation management and fraud detection

AI/ML Stack
- Scikit-learn Random Forest classifier for fraud detection
- Fast API for managing endpoints with model classification 

## System Requirements
- Docker and Docker Compose

## Installation & Setup
1. Clone the Repository
```
git clone <repository-url>
cd nenya
```

2.  Build and start all services
```
docker-compose up --build
```

3. Navigate to the application
```
http://localhost:3000
```


## Usage
1. Generate Transactions
- Click the shuffle button to generate a sample size of 1000 transcations
- This will take a while so please wait patiently until the analytics load in 

2. Clear Transactions
- Click the trash can button to clear the transactions

3. Interative Globe
- Every heat spot on the globe that represents a fraudulent transaction 
- Each fraudulent transaction is mapped accurately with latitude and longitudinal coordinates 
- Interact with any heat spot to reveal metadata for that transaction including location coordinates, device used for purchase, and more.

4. Insights
- The following analytics are calculated and displayed:

- Rate of Fraudulent Transactions
- Fraud Losses as a Percentage of Revenue
- Monetary Loss Due to Fraudulent Transactions
- Average Risk Score
- Average Transaction Amount
- Average Fraudulent Transaction Amount
- High Risk Transactions
- Transaction Sample Size

## Docker Services

services
- fraud-api:      # Fast API server (Port 8000)
- backend:     # Spring server (Port 8080)  
- frontend:    # Next.js app (Port 3000)




