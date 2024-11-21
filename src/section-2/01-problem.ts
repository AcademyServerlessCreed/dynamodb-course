/*
DynamoDB GetItem Exercise - Product Lookup

Goal: Learn how to retrieve a product from a DynamoDB table using the GetItem command 
with composite keys (Partition Key and Sort Key).

Scenario:
An e-commerce platform needs to implement a product details page. When a customer clicks 
on a product, the system needs to fetch the complete product information using the 
product ID. The system uses a composite key structure where:
- Partition Key (PK) = "PRODUCT#{productId}"
- Sort Key (SK) = "METADATA#{productId}"

Key Concepts:
- Using composite keys (PK and SK)
- marshall() converts JavaScript objects to DynamoDB AttributeValue format
- unmarshall() converts DynamoDB AttributeValue format back to JavaScript objects
- Strong consistency reads for accurate product information
- Error handling for non-existent products
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  GetItemCommand,
  GetItemCommandInput,
  GetItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import assert from 'assert';

import {
  REGION,
  SECTION_2_ACCESS_KEY,
  SECTION_2_SECRET_KEY,
  SECTION_2_TABLE_NAME,
  
} from "../key";
// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: REGION,
  // Add your credentials here
  credentials: {
    accessKeyId: SECTION_2_ACCESS_KEY,
    secretAccessKey: SECTION_2_SECRET_KEY,
  },
});
const TABLE_NAME = SECTION_2_TABLE_NAME;

// Product interface for type checking
interface Product {
  PK: string;
  SK: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lastUpdated: string;
  brand: string;
}

// Response interface
interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}

const getProduct = async (productId: string): Promise<ProductResponse> => {
  try {
    // TODO: Create the GetItemCommandInput object
    // Hint 1: Use marshall() to convert the composite key to DynamoDB format
    // Hint 2: The key should include both PK and SK
    // Hint 3: Consider using ConsistentRead for accurate data
    const input: GetItemCommandInput = {
      // Fill in the input properties
    };

    // TODO: Execute the GetItemCommand
    // Hint: Use client.send() with the GetItemCommand
    const response = // Create and execute the command

    // TODO: Handle the response
    // Hint 1: Check if response.Item exists
    // Hint 2: Use unmarshall() to convert DynamoDB format to Product
    // Hint 3: Return appropriate ProductResponse object
    
  } catch (error) {
    // TODO: Implement error handling
    // Hint: Return a ProductResponse with success: false and error message
  }
};

// Test cases
async function runTests() {
  try {
    console.log('\n🚀 Starting tests for getProduct function...\n');

    // Test 1: Valid product ID
    console.log('Test 1: Fetching product with ID "001"');
    const result1 = await getProduct("001");
    assert(result1.success === true, '❌ Failed: Product should be found');
    assert(result1.data !== undefined, '❌ Failed: Product data should exist');
    console.log('✅ Passed: Successfully retrieved product');
    console.log('📦 Received:', result1.data);

    console.log('\n-------------------\n');

    // Test 2: Invalid product ID
    console.log('Test 2: Fetching non-existent product with ID "999"');
    const result2 = await getProduct("999");
    assert(result2.success === false, '❌ Failed: Should return failure for non-existent product');
    assert(result2.error !== undefined, '❌ Failed: Should include error message');
    console.log('✅ Passed: Correctly handled non-existent product');
    console.log('❌ Error:', result2.error);

    console.log('\n-------------------\n');

    // Test 3: Error handling
    console.log('Test 3: Testing error handling with invalid table name');
    // Temporarily modify table name to force an error
    const originalTableName = TABLE_NAME;
    (global as any).TABLE_NAME = "InvalidTable";
    
    try {
      await getProduct("001");
      assert(false, '❌ Failed: Should throw error for invalid table');
    } catch (error) {
      console.log('✅ Passed: Correctly handled error condition');
    }
    
    // Restore table name
    (global as any).TABLE_NAME = originalTableName;

    console.log('\n🎉 All tests passed! Your implementation is working correctly!');

  } catch (error:any) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Tip: Check if you have:');
    console.log('1. Properly constructed the composite key (PK and SK)');
    console.log('2. Used marshall() for the key attributes');
    console.log('3. Handled the response.Item check correctly');
    console.log('4. Properly unmarshalled the response');
    console.log('5. Implemented proper error handling');
    throw error;
  }
}

runTests();