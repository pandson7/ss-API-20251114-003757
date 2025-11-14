# Product Specifications API - Architecture Diagrams

This directory contains AWS Architecture diagrams for the Product Specifications API project, generated based on the technical design specification.

## Generated Diagrams

### 1. product-api-architecture.png
**Overview Architecture Diagram**
- Shows the high-level serverless architecture
- Displays the main components: API Gateway, Lambda functions, DynamoDB
- Illustrates the basic data flow from client to database
- Includes monitoring with CloudWatch

**Key Components:**
- API Gateway (REST API endpoint)
- 5 Lambda functions (getProducts, getProductById, createProduct, updateProduct, deleteProduct)
- DynamoDB table with Global Secondary Indexes
- CloudWatch for logging and metrics

### 2. product-api-detailed-flow.png
**Detailed Data Flow Diagram**
- Shows specific API endpoints and their corresponding Lambda functions
- Illustrates different data access patterns
- Displays how GSIs are used for filtering and querying
- Shows the relationship between client requests and backend processing

**Key Features:**
- Client request types (GET, POST, PUT, DELETE)
- Business logic layer with specific function purposes
- Data persistence layer with main table and indexes
- Observability components

### 3. product-api-security-deployment.png
**Security & Deployment Architecture**
- Focuses on security controls and deployment pipeline
- Shows infrastructure as code approach using AWS CDK
- Illustrates monitoring and alerting setup
- Displays security measures like API keys, CORS, and rate limiting

**Security Features:**
- API Key authentication
- CORS configuration
- Rate limiting and throttling
- Encryption at rest with KMS
- Comprehensive monitoring and alerting

## Architecture Highlights

### Serverless Design
- Fully serverless architecture using AWS Lambda and DynamoDB
- No server management required
- Automatic scaling based on demand
- Pay-per-use pricing model

### Data Access Patterns
- Primary key access for single item retrieval
- Global Secondary Indexes for category and brand filtering
- Pagination support for large result sets
- Flexible JSON storage for product specifications

### Security & Compliance
- API Gateway with authentication and authorization
- Input validation at Lambda function level
- Encryption at rest and in transit
- Comprehensive logging and monitoring

### Deployment Strategy
- Infrastructure as Code using AWS CDK
- Single CloudFormation stack deployment
- Environment-specific configurations
- Automated deployment pipeline

## Technical Specifications

### Lambda Functions
- Runtime: Node.js 18.x
- Memory: 256MB
- Timeout: 30 seconds
- Environment variables for configuration

### DynamoDB Configuration
- Table: ProductSpecifications
- Partition Key: productId (String)
- Billing Mode: On-demand
- Global Secondary Indexes: CategoryIndex, BrandIndex

### API Gateway Setup
- Regional API Gateway
- CORS enabled for web clients
- API key authentication
- Rate limiting and throttling enabled

These diagrams provide a comprehensive view of the Product Specifications API architecture, covering functional, security, and operational aspects of the system.
