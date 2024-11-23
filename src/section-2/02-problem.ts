/*
DynamoDB Query Exercise - Category Search with Pagination

Goal: Implement a product search functionality that allows users to search products 
by category with optional price range filtering and pagination support.

Scenario:
An e-commerce platform needs to implement a category browsing feature where users can:
1. View all products in a specific category
2. Filter products by price range
3. View results in pages (pagination)
4. Sort products by price
5. See only relevant product attributes for the listing page

Key Concepts:
- Using Query operation with GSI (Global Secondary Index)
- Implementing pagination with LastEvaluatedKey Optional
- Using KeyConditionExpression for filtering
- Projection Expression for optimizing data transfer
- Marshall/Unmarshall for type safety
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  AttributeValue
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  REGION,
  SECTION_2_ACCESS_KEY,
  SECTION_2_SECRET_KEY,
  SECTION_2_TABLE_NAME,
} from "../key";
import assert from "assert";

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: SECTION_2_ACCESS_KEY,
    secretAccessKey: SECTION_2_SECRET_KEY,
  },
});
const TABLE_NAME = SECTION_2_TABLE_NAME;

// Type definitions
interface Product {
  productId: string;
  name: string;
  category: string;
  price: number;
  brand: string;
  stock: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface ProductQueryParams {
  category: string;
  priceRange?: PriceRange;
  lastEvaluatedKey?: Record<string, AttributeValue>;
  limit?: number;
}

interface ProductListResponse {
  success: boolean;
  data?: Product[];
  lastEvaluatedKey?: Record<string, AttributeValue>;
  error?: string;
}

const searchProductsByCategory = async (
  params: ProductQueryParams
): Promise<ProductListResponse> => {
  try {
    // TODO: Create expression attribute values
    // Hint 1: Start with category value
    // Hint 2: Add price range values if provided
    // Hint 3: Use marshall() to convert values to DynamoDB format
    const expressionAttributeValues = // Your code here

    // TODO: Create key condition expression
    // Hint 1: Start with category condition
    // Hint 2: Add price range condition if provided
    let keyConditionExpression = // Your code here

    // TODO: Create QueryCommandInput
    // Hint 1: Use the CategoryPriceIndex GSI
    // Hint 2: Include pagination parameters
    // Hint 3: Add projection expression for optimization
    const input: QueryCommandInput = {
      // Fill in the input properties
    };

    // TODO: Execute query and handle response
    // Hint 1: Use QueryCommand
    // Hint 2: Unmarshall the items
    // Hint 3: Handle pagination token (LastEvaluatedKey)
    const response = // Your code here

    // TODO: Process and return results
    // Hint 1: Map items to Product interface
    // Hint 2: Include LastEvaluatedKey if more results exist
    return // Your code here

  } catch (error) {
    // TODO: Implement error handling
    // Hint: Return appropriate error response
  }
};

// Test cases
async function runTests() {
  try {
    console.log('\n🚀 Starting tests for searchProductsByCategory function...\n');

    // Test 1: Basic category search
    console.log('Test 1: Search Electronics category');
    const result1 = await searchProductsByCategory({
      category: "Electronics",
      limit: 5
    });
    assert(result1.success === true, '❌ Failed: Should return success');
    assert(Array.isArray(result1.data), '❌ Failed: Should return array of products');
    assert(result1.data!.length <= 5, '❌ Failed: Should respect limit parameter');
    console.log('✅ Passed: Basic category search');
    console.log('📦 First page results:', result1.data);

    console.log('\n-------------------\n');

    // Test 2: Category search with price range
    console.log('Test 2: Search Electronics with price range $500-$1000');
    const result2 = await searchProductsByCategory({
      category: "Electronics",
      priceRange: { min: 500, max: 1000 },
      limit: 5
    });
    assert(result2.success === true, '❌ Failed: Should return success');
    assert(
      result2.data!.every(p => p.price >= 500 && p.price <= 1000),
      '❌ Failed: All products should be within price range'
    );
    console.log('✅ Passed: Price range filtering');
    console.log('📦 Price filtered results:', result2.data);

    console.log('\n-------------------\n');

    // Test 3: Pagination
    console.log('Test 3: Testing pagination');
    const firstPage = await searchProductsByCategory({
      category: "Electronics",
      limit: 2
    });
    
    assert(firstPage.lastEvaluatedKey !== undefined, 
      '❌ Failed: Should have LastEvaluatedKey for pagination');

    const secondPage = await searchProductsByCategory({
      category: "Electronics",
      limit: 2,
      lastEvaluatedKey: firstPage.lastEvaluatedKey
    });

    assert(
      JSON.stringify(firstPage.data![0]) !== JSON.stringify(secondPage.data![0]),
      '❌ Failed: Second page should have different items'
    );
    console.log('✅ Passed: Pagination test');
    console.log('📦 First page:', firstPage.data);
    console.log('📦 Second page:', secondPage.data);

    console.log('\n-------------------\n');

    // Test 4: Non-existent category
    console.log('Test 4: Search non-existent category');
    const result4 = await searchProductsByCategory({
      category: "NonExistentCategory",
      limit: 5
    });
    assert(result4.success === true, '❌ Failed: Should return success');
    assert(result4.data!.length === 0, '❌ Failed: Should return empty array');
    console.log('✅ Passed: Non-existent category handling');

    console.log('\n-------------------\n');
    console.log('🎉 All tests passed! Your implementation is working correctly!');

  } catch (error:any) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Tip: Check if you have:');
    console.log('1. Properly constructed the KeyConditionExpression');
    console.log('2. Correctly handled price range filtering');
    console.log('3. Implemented pagination correctly');
    console.log('4. Used the correct GSI (CategoryPriceIndex)');
    console.log('5. Properly marshalled/unmarshalled the data');
    throw error;
  }
}

runTests();


