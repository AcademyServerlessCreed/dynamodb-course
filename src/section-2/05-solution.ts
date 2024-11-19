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
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DeleteItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  REGION,
  SECTION_2_ACCESS_KEY,
  SECTION_2_SECRET_KEY,
  SECTION_2_TABLE_NAME_PUT_DELETE,
} from "../key";
import assert from "assert";

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: SECTION_2_ACCESS_KEY,
    secretAccessKey: SECTION_2_SECRET_KEY,
  },
});

const TABLE_NAME = SECTION_2_TABLE_NAME_PUT_DELETE;

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

const deleteProduct = async (productId: string): Promise<DeleteResponse> => {
  try {
    // Validate product ID format
    if (!productId || typeof productId !== "string") {
      return {
        success: false,
        error: "Invalid product ID format",
      };
    }

    // Format composite keys
    const PK = `PRODUCT#${productId}`;
    const SK = `METADATA#${productId}`;

    const input: DeleteItemCommandInput = {
      TableName: TABLE_NAME,
      Key: marshall({
        PK,
        SK,
      }),
      // Return the old item so we can confirm what was deleted
      ReturnValues: "ALL_OLD",
      // Ensure the item exists before attempting deletion
      ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
    };

    const response = await client.send(new DeleteItemCommand(input));

    // Check if an item was actually deleted
    if (!response.Attributes) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Convert the deleted item from DynamoDB format
    const deletedItem = unmarshall(response.Attributes);

    return {
      success: true,
      message: "Product deleted successfully",
      deletedItem: {
        productId: deletedItem.productId,
        name: deletedItem.name,
        category: deletedItem.category,
        deletedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        success: false,
        error: "Product does not exist",
      };
    }

    return {
      success: false,
      error: `Failed to delete product: ${error.message}`,
    };
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for deleteProduct function...\n");

    // Test 1: Delete existing product (101 from previous exercise)
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

    // Test 2: Attempt to delete the same product again
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

    console.log(
      "\n🎉 All tests passed! Your implementation is working correctly!"
    );
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

// Run the tests
runTests();
