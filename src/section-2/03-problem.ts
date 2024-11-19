/*
DynamoDB UpdateItem Exercise - Inventory Management

Goal: Implement an inventory management system that safely updates product stock levels
while maintaining data consistency and preventing invalid states.

Scenario:
A warehouse management system needs to handle stock updates for products. The system must:
1. Add or remove stock safely (no negative stock)
2. Track update history
3. Handle concurrent updates
4. Prevent invalid stock modifications
5. Maintain audit trail of changes

Key Concepts:
- Using UpdateItem with atomic operations
- Implementing condition expressions for data consistency
- Working with update expressions and expression attribute names/values
- Handling optimistic locking
- Error handling for conditional updates

Business Rules:
1. Stock cannot go below 0
2. Single update cannot change stock by more than 100 units
3. Must track last update time and user
4. Must maintain update history
5. Must handle concurrent updates safely
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  UpdateItemCommand,
  UpdateItemCommandInput,
  ConditionalCheckFailedException
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import assert from 'assert';

import {
    REGION,
    SECTION_2_ACCESS_KEY,
    SECTION_2_SECRET_KEY,
    SECTION_2_TABLE_NAME,
  } from "../key";
  
  const client = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: SECTION_2_ACCESS_KEY,
      secretAccessKey: SECTION_2_SECRET_KEY,
    },
  });
  const TABLE_NAME = SECTION_2_TABLE_NAME;
  import { UpdateStockRequest, ProductResponse, Product } from "./types";



async function updateInventory(
  request: UpdateStockRequest
): Promise<ProductResponse> {
  try {
    // TODO: Validate input
    // Hint 1: Check quantity limits
    // Hint 2: Validate operation type
    // Hint 3: Check for required fields

    // TODO: Create update expression
    // Hint 1: Use atomic ADD or SUBTRACT
    // Hint 2: Update lastModified timestamp
    // Hint 3: Append to update history
    const updateExpression = // Your code here

    // TODO: Create condition expression
    // Hint 1: Prevent negative stock
    // Hint 2: Limit maximum change
    // Hint 3: Add version check for optimistic locking
    const conditionExpression = // Your code here

    // TODO: Create expression attribute values
    // Hint 1: Include stock change value
    // Hint 2: Add timestamp
    // Hint 3: Add history entry
    const expressionAttributeValues = // Your code here

    // TODO: Create expression attribute names
    // Hint 1: Map update expression attributes
    // Hint 2: Map condition expression attributes
    const expressionAttributeNames = // Your code here

    // TODO: Create UpdateItemCommandInput
    // Hint 1: Include all expressions
    // Hint 2: Add ReturnValues
    const input: UpdateItemCommandInput = {
      // Fill in the input properties
    };

    // TODO: Execute update and handle response
    // Hint 1: Use UpdateItemCommand
    // Hint 2: Handle ConditionalCheckFailedException
    // Hint 3: Return updated stock value
    const response = // Your code here

    return // Your code here

  } catch (error) {
    // TODO: Implement error handling
    // Hint: Handle different error types
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for updateInventory function...\n");

    // Test 1: Add stock
    console.log("Test 1: Add 10 units to product stock");
    const result1 = await updateInventory({
      productId: "001",
      quantity: 10,
      operation: "add",
      updatedBy: "system",
    });
    assert(
      result1.success === true,
      "❌ Failed: Should successfully add stock"
    );
    assert(
      result1.data?.stock !== undefined,
      "❌ Failed: Should return new stock level"
    );
    console.log("✅ Passed: Stock addition");
    console.log("📦 New stock level:", result1.data?.stock);

    console.log("\n-------------------\n");

    // Test 2: Remove stock
    console.log("Test 2: Remove 5 units from product stock");
    const result2 = await updateInventory({
      productId: "001",
      quantity: 5,
      operation: "subtract",
      updatedBy: "system",
    });
    assert(
      result2.success === true,
      "❌ Failed: Should successfully remove stock"
    );
    assert(result2.data!.stock >= 0, "❌ Failed: Stock should not go negative");
    console.log("✅ Passed: Stock removal");
    console.log("📦 New stock level:", result2.data?.stock);

    console.log("\n-------------------\n");
   
    // Test 3: Concurrent updates
    console.log("Test 3: Testing concurrent updates");
    const updates = await Promise.all([
      updateInventory({
        productId: "001",
        quantity: 1,
        operation: "add",
        updatedBy: "user1",
      }),
      updateInventory({
        productId: "001",
        quantity: 1,
        operation: "add",
        updatedBy: "user2",
      }),
    ]);
    assert(
      updates.every((result) => result.success === true),
      "❌ Failed: Should handle concurrent updates"
    );
    console.log("✅ Passed: Concurrent updates");
    console.log("📦 Update results:", updates);

    console.log("\n-------------------\n");
    console.log(
      "🎉 All tests passed! Your implementation is working correctly!"
    );
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n💡 Tip: Check if you have:");
    console.log("1. Properly handled atomic updates");
    console.log("2. Implemented all condition expressions");
    console.log("3. Correctly managed the update history");
    console.log("4. Handled concurrent updates properly");
    console.log("5. Validated input parameters");
    throw error;
  }
}

runTests();
