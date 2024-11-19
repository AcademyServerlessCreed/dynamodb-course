import {
  DynamoDBClient,
  UpdateItemCommand,
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UpdateStockRequest, ProductResponse, Product } from "./types";

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
async function updateInventory(
  request: UpdateStockRequest
): Promise<ProductResponse> {
  try {
    // Marshall the key attributes
    const key = marshall({
      PK: `PRODUCT#${request.productId}`,
      SK: `METADATA#${request.productId}`,
    });

    // Determine the update operation
    const quantityUpdate =
      request.operation === "add" ? "stock + :quantity" : "stock - :quantity";

    // Marshall the expression attribute values
    const expressionAttributeValues = marshall({
      ":quantity": String(request.quantity),
      ":zero": "0",
      ":updateTime": new Date().toISOString(),
    });

    const command = new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: `SET stock = :quantity,
                        lastUpdated = :updateTime`,
      ConditionExpression: "attribute_not_exists(stock) OR (attribute_exists(stock) AND stock >= :zero)",
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const response = await client.send(command);
    const data = response.Attributes
      ? (unmarshall(response.Attributes) as Product)
      : undefined;

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    if (error instanceof ConditionalCheckFailedException) {
      return {
        success: false,
        error: "Insufficient stock available",
      };
    }

    console.error("UpdateItem error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

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
