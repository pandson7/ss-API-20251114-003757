import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ProductApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const suffix = '003757';

    // DynamoDB Table
    const productsTable = new dynamodb.Table(this, `ProductsTable${suffix}`, {
      tableName: `ProductSpecifications${suffix}`,
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable auto scaling
    productsTable.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    productsTable.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // Global Secondary Indexes
    productsTable.addGlobalSecondaryIndex({
      indexName: 'CategoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
    });

    productsTable.addGlobalSecondaryIndex({
      indexName: 'BrandIndex',
      partitionKey: { name: 'brand', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
    });

    // Lambda Functions
    const getProductsFunction = new lambda.Function(this, `GetProductsFunction${suffix}`, {
      functionName: `getProducts${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { category, brand, name, limit = '20', lastKey } = event.queryStringParameters || {};
    
    let command;
    let params = {
      TableName: process.env.TABLE_NAME,
      Limit: parseInt(limit)
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
    }

    if (category) {
      command = new QueryCommand({
        ...params,
        IndexName: 'CategoryIndex',
        KeyConditionExpression: 'category = :category',
        ExpressionAttributeValues: { ':category': category }
      });
    } else if (brand) {
      command = new QueryCommand({
        ...params,
        IndexName: 'BrandIndex',
        KeyConditionExpression: 'brand = :brand',
        ExpressionAttributeValues: { ':brand': brand }
      });
    } else {
      command = new ScanCommand(params);
      if (name) {
        command.input.FilterExpression = 'contains(#name, :name)';
        command.input.ExpressionAttributeNames = { '#name': 'name' };
        command.input.ExpressionAttributeValues = { ':name': name };
      }
    }

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        items: result.Items,
        lastKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
        count: result.Count
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    const getProductByIdFunction = new lambda.Function(this, `GetProductByIdFunction${suffix}`, {
      functionName: `getProductById${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { productId } = event.pathParameters;
    
    const command = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    const createProductFunction = new lambda.Function(this, `CreateProductFunction${suffix}`, {
      functionName: `createProduct${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    if (!body.name || !body.category || !body.brand) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: name, category, brand' 
          } 
        })
      };
    }

    const product = {
      productId: randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const command = new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: product
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(product)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    const updateProductFunction = new lambda.Function(this, `UpdateProductFunction${suffix}`, {
      functionName: `updateProduct${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { productId } = event.pathParameters;
    const body = JSON.parse(event.body);

    // Check if product exists
    const getCommand = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId }
    });

    const existing = await docClient.send(getCommand);
    if (!existing.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
      };
    }

    const updateCommand = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId },
      UpdateExpression: 'SET #name = :name, category = :category, brand = :brand, specifications = :specifications, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': body.name || existing.Item.name,
        ':category': body.category || existing.Item.category,
        ':brand': body.brand || existing.Item.brand,
        ':specifications': body.specifications || existing.Item.specifications,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    const deleteProductFunction = new lambda.Function(this, `DeleteProductFunction${suffix}`, {
      functionName: `deleteProduct${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { productId } = event.pathParameters;

    // Check if product exists
    const getCommand = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId }
    });

    const existing = await docClient.send(getCommand);
    if (!existing.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
      };
    }

    const deleteCommand = new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { productId }
    });

    await docClient.send(deleteCommand);

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    // Grant DynamoDB permissions to Lambda functions
    productsTable.grantReadWriteData(getProductsFunction);
    productsTable.grantReadWriteData(getProductByIdFunction);
    productsTable.grantReadWriteData(createProductFunction);
    productsTable.grantReadWriteData(updateProductFunction);
    productsTable.grantReadWriteData(deleteProductFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, `ProductsApi${suffix}`, {
      restApiName: `Products API ${suffix}`,
      description: 'API for managing product specifications',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const products = api.root.addResource('products');
    const product = products.addResource('{productId}');

    // API Gateway integrations
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsFunction));
    products.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction));
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductByIdFunction));
    product.addMethod('PUT', new apigateway.LambdaIntegration(updateProductFunction));
    product.addMethod('DELETE', new apigateway.LambdaIntegration(deleteProductFunction));

    // Sample data seeding function
    const seedDataFunction = new lambda.Function(this, `SeedDataFunction${suffix}`, {
      functionName: `seedData${suffix}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const sampleProducts = [
  {
    productId: 'PROD-001',
    name: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    brand: 'TechSound',
    specifications: {
      batteryLife: '20 hours',
      weight: '250g',
      color: 'Black',
      connectivity: 'Bluetooth 5.0',
      noiseCancellation: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'PROD-002',
    name: 'Ergonomic Office Chair',
    category: 'Furniture',
    brand: 'ComfortSeating',
    specifications: {
      material: 'Mesh fabric',
      weight: '15kg',
      dimensions: '65x65x110cm',
      adjustableHeight: true,
      lumbarSupport: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'PROD-003',
    name: 'Smart LED TV 55 inch',
    category: 'Electronics',
    brand: 'VisionTech',
    specifications: {
      screenSize: '55 inches',
      resolution: '4K Ultra HD',
      smartFeatures: true,
      hdmiPorts: 4,
      weight: '18kg'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'PROD-004',
    name: 'Running Shoes',
    category: 'Sports',
    brand: 'ActiveFeet',
    specifications: {
      material: 'Breathable mesh',
      sole: 'Rubber',
      cushioning: 'Air cushion',
      waterproof: false,
      sizes: ['7', '8', '9', '10', '11']
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    productId: 'PROD-005',
    name: 'Coffee Maker',
    category: 'Appliances',
    brand: 'BrewMaster',
    specifications: {
      capacity: '12 cups',
      programmable: true,
      autoShutoff: true,
      material: 'Stainless steel',
      warranty: '2 years'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

exports.handler = async (event) => {
  try {
    const putRequests = sampleProducts.map(product => ({
      PutRequest: { Item: product }
    }));

    const command = new BatchWriteCommand({
      RequestItems: {
        [process.env.TABLE_NAME]: putRequests
      }
    });

    await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Sample data seeded successfully', count: sampleProducts.length })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    productsTable.grantWriteData(seedDataFunction);

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'SeedFunctionName', {
      value: seedDataFunction.functionName,
      description: 'Seed Data Function Name',
    });
  }
}
