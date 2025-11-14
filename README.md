# Product Specifications API

A complete AWS serverless API solution for managing product specifications with flexible JSON schema support. Built with AWS CDK, Lambda, DynamoDB, and API Gateway.

## 🚀 Features

- **RESTful API**: Complete CRUD operations for product management
- **Flexible Schema**: JSON-based product specifications with dynamic attributes
- **High Performance**: DynamoDB with Global Secondary Indexes for efficient querying
- **Auto-scaling**: Provisioned capacity with automatic scaling (1-10 units)
- **Serverless**: AWS Lambda functions with Node.js 22.x runtime
- **CORS Enabled**: Ready for web client integration
- **Comprehensive Testing**: All endpoints validated with sample data

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Retrieve all products with filtering and pagination |
| GET | `/products/{productId}` | Retrieve specific product by ID |
| POST | `/products` | Create new product |
| PUT | `/products/{productId}` | Update existing product |
| DELETE | `/products/{productId}` | Delete product by ID |

### Query Parameters (GET /products)
- `category`: Filter by product category
- `brand`: Filter by product brand  
- `name`: Search by product name (contains)
- `limit`: Number of items per page (default: 20)
- `lastKey`: Pagination token

## 🏗️ Architecture

### AWS Services Used
- **API Gateway**: RESTful API endpoints with CORS
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB**: NoSQL database with Global Secondary Indexes
- **IAM**: Secure role-based access control
- **CloudFormation**: Infrastructure as Code via AWS CDK

### Database Schema
```json
{
  "productId": "string (UUID)",
  "name": "string (required)",
  "category": "string (required)",
  "brand": "string (required)",
  "specifications": {
    // Flexible JSON object for product attributes
  },
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

## 🛠️ Project Structure

```
ss-API-20251114-003757/
├── README.md                    # This file
├── PROJECT_SUMMARY.md           # Detailed project summary
├── cdk-app/                     # AWS CDK Infrastructure
│   ├── lib/cdk-app-stack.ts     # CDK stack definition
│   ├── bin/cdk-app.ts           # CDK app entry point
│   ├── package.json             # Dependencies
│   └── test/                    # Unit tests
├── generated-diagrams/          # Architecture diagrams
│   ├── product-api-architecture.png
│   ├── product-api-detailed-flow.png
│   └── product-api-security-deployment.png
├── specs/                       # Project specifications
│   ├── requirements.md          # Business requirements
│   ├── design.md               # Technical design
│   └── tasks.md                # Implementation tasks
├── pricing/                     # Cost analysis
│   └── detailed-pricing-analysis.md
├── jira-stories-summary.md      # User stories
└── qr-code/                     # Project QR code
    └── qr-code-ss-API-20251114-003757.png
```

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- AWS CDK CLI installed (`npm install -g aws-cdk`)

### Deployment
```bash
cd cdk-app
npm install
cdk bootstrap  # First time only
cdk deploy
```

### API Usage Examples

```bash
# Base URL (replace with your deployed API Gateway URL)
BASE_URL="https://jfv108ytwc.execute-api.us-east-1.amazonaws.com/prod"

# Get all products
curl "$BASE_URL/products"

# Filter by category
curl "$BASE_URL/products?category=Electronics"

# Get specific product
curl "$BASE_URL/products/PROD-001"

# Create new product
curl -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "category": "Electronics",
    "brand": "TechGear",
    "specifications": {
      "connectivity": "Bluetooth 5.0",
      "battery": "Rechargeable Li-ion",
      "dpi": "1600"
    }
  }'

# Update product
curl -X PUT "$BASE_URL/products/PROD-001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "specifications": {
      "newFeature": "Enhanced performance"
    }
  }'

# Delete product
curl -X DELETE "$BASE_URL/products/PROD-001"
```

## 📊 Sample Data

The API comes pre-populated with sample products:

1. **Wireless Bluetooth Headphones** (Electronics/TechSound)
2. **Ergonomic Office Chair** (Furniture/ComfortSeating)  
3. **Smart LED TV 55 inch** (Electronics/VisionTech)
4. **Coffee Maker** (Appliances/BrewMaster)

## 🔒 Security Features

- IAM roles with least-privilege access
- Input validation and sanitization
- Proper error handling without sensitive data exposure
- CORS configuration for web client security

## 📈 Performance & Scalability

- **Auto-scaling DynamoDB**: 1-10 read/write capacity units
- **Global Secondary Indexes**: Efficient category and brand filtering
- **Pagination Support**: Handle large datasets with `lastKey` parameter
- **Serverless Architecture**: Automatic scaling based on demand

## 🧪 Testing

All API endpoints have been thoroughly tested:
- ✅ CRUD operations validation
- ✅ Query parameter filtering
- ✅ Error handling (404, 400, 500)
- ✅ Data validation and schema compliance
- ✅ Performance with sample data

## 💰 Cost Optimization

- Provisioned DynamoDB with auto-scaling
- Lambda functions with efficient memory allocation
- API Gateway with usage-based pricing
- Estimated monthly cost: $5-20 for moderate usage

## 📚 Documentation

- [Requirements](specs/requirements.md) - Business requirements and user stories
- [Technical Design](specs/design.md) - Architecture and implementation details
- [Implementation Tasks](specs/tasks.md) - Development roadmap
- [Pricing Analysis](pricing/detailed-pricing-analysis.md) - Cost breakdown
- [Project Summary](PROJECT_SUMMARY.md) - Comprehensive project overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the [Project Summary](PROJECT_SUMMARY.md) for detailed information
2. Review the API documentation above
3. Examine the CDK stack in `cdk-app/lib/cdk-app-stack.ts`

---

**Built with ❤️ using AWS CDK and serverless technologies**
