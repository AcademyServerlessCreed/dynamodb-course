/*
DynamoDB DeleteItem Exercise - Product Removal

Goal: Learn how to remove a product from DynamoDB table using the DeleteItem command
with proper validation and error handling.

Scenario:
An e-commerce platform needs to implement a product deletion system. When removing a product,
the system needs to:
1. Verify the product exists before deletion
2. Ensure proper key formatting
3. Return the deleted item for confirmation
4. Log the deletion operation
5. Handle various error cases appropriately

Key Concepts:
- Using composite keys (PK and SK) format
- Using marshall() for DynamoDB AttributeValue format
- Using unmarshall() to convert DynamoDB response
- Implementing conditional expressions
- Error handling and validation
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DeleteItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import assert from "assert";

// Response interface for delete operation
interface DeleteResponse {
  success: boolean;
  message?: string;
  deletedItem?: {
    productId: string;
    name: string;
    category: string;
    deletedAt: string;
  };
  error?: string;
}

/**
 * Delete Operation Requirements:
 * 
 * 1. Input Validation:
 *    - Verify productId is non-empty string
 *    - Format composite keys (PK = PRODUCT#{id}, SK = METADATA#{id})
 * 
 * 2. DynamoDB Operation:
 *    - Use DeleteItemCommand with proper input structure
 *    - Include condition to verify item exists
 *    - Request the deleted item to be returned (ReturnValues)
 * 
 * 3. Error Handling:
 *    - Handle ConditionalCheckFailedException
 *    - Handle general errors with appropriate messages
 *    - Return properly formatted DeleteResponse
 * 
 * 4. Response Processing:
 *    - Verify deletion success
 *    - Format deleted item details if available
 *    - Include timestamp of deletion
 */

// Your task is to implement this function
const deleteProduct = async (productId: string): Promise<DeleteResponse> => {
  try {
    // TODO: Implement input validation
    // Hint 1: Check if productId is valid
    // Hint 2: Format PK and SK correctly

    // TODO: Create DeleteItemCommandInput
    // Hint 1: Include TableName and Key
    // Hint 2: Add condition expression
    // Hint 3: Request return values
    const input: DeleteItemCommandInput = {
      // Fill in the required properties
    };

    // TODO: Execute DeleteItemCommand
    // Hint: Use client.send()
    const response = // Your code here

    // TODO: Process the response
    // Hint 1: Check if item was actually deleted
    // Hint 2: Format the response with deleted item details
    // Hint 3: Include current timestamp

    // TODO: Return successful response
    
  } catch (error) {
    // TODO: Implement error handling
    // Hint 1: Handle ConditionalCheckFailedException
    // Hint 2: Handle other errors appropriately
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for deleteProduct function...\n");

    // Test 1: Delete existing product
    console.log("Test 1: Deleting existing product (ID: 101)");
    const result1 = await deleteProduct("101");
    assert(
      result1.success === true,
      "❌ Failed: Should delete existing product successfully"
    );
    assert(
      result1.deletedItem?.productId === "101",
      "❌ Failed: Should return correct product ID"
    );
    console.log("✅ Passed: Product deleted successfully");
    console.log("📦 Deleted item details:", result1.deletedItem);

    // Test 2: Attempt to delete non-existent product
    console.log("\nTest 2: Attempting to delete already deleted product");
    const result2 = await deleteProduct("101");
    assert(
      result2.success === false,
      "❌ Failed: Should fail when deleting non-existent product"
    );
    console.log("✅ Passed: Properly handled deletion of non-existent product");
    console.log("❌ Error:", result2.error);

    // Test 3: Invalid product ID
    console.log("\nTest 3: Attempting to delete with invalid product ID");
    const result3 = await deleteProduct("");
    assert(
      result3.success === false,
      "❌ Failed: Should reject invalid product ID"
    );
    console.log("✅ Passed: Invalid ID rejected");

    console.log("\n🎉 All tests passed! Your implementation is working correctly!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.log("\n💡 Tip: Check if you have:");
    console.log("1. Properly formatted the composite keys");
    console.log("2. Handled the condition expression correctly");
    console.log("3. Properly unmarshalled the returned item");
    console.log("4. Implemented proper error handling");
    console.log("5. Validated inputs correctly");
    throw error;
  }
}

runTests();