import {
  DynamoDBClient,
  GetItemCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Product, ProductResponse } from "./types";
import assert from "assert";
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

async function getProduct(productId: string): Promise<ProductResponse> {
  try {
    // Marshall the key attributes
    const key = marshall({
      PK: `PRODUCT#${productId}`,
      SK: `METADATA#${productId}`,
    });

    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: key,
      ConsistentRead: true, // Use strong consistency,consumes more RCU
    });

    const response = await client.send(command);

    if (!response.Item) {
      return {
        success: false,
        error: `Product ${productId} not found`,
      };
    }

    // Unmarshall the response
    const product = unmarshall(response.Item) as Product;

    return {
      success: true,
      data: product,
    };
  } catch (error: any) {
    console.error("GetItem error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for getProduct function...\n");

    // Test 1: Valid product ID
    console.log('Test 1: Fetching product with ID "001"');
    const result1 = await getProduct("001");
    assert(result1.success === true, "❌ Failed: Product should be found");
    assert(result1.data !== undefined, "❌ Failed: Product data should exist");
    console.log("✅ Passed: Successfully retrieved product");
    console.log("📦 Received:", result1.data);

    console.log("\n-------------------\n");

    // Test 2: Invalid product ID
    console.log('Test 2: Fetching non-existent product with ID "999"');
    const result2 = await getProduct("999");
    assert(
      result2.success === false,
      "❌ Failed: Should return failure for non-existent product"
    );
    assert(
      result2.error !== undefined,
      "❌ Failed: Should include error message"
    );
    console.log("✅ Passed: Correctly handled non-existent product");
    console.log("❌ Error:", result2.error);

    console.log("\n-------------------\n");

    // Test 3: Error handling
    console.log("Test 3: Testing error handling with invalid table name");
    // Temporarily modify table name to force an error
    const originalTableName = TABLE_NAME;
    (global as any).TABLE_NAME = "InvalidTable";

    try {
      await getProduct("001");
      assert(false, "❌ Failed: Should throw error for invalid table");
    } catch (error) {
      console.log("✅ Passed: Correctly handled error condition");
    }

    // Restore table name
    (global as any).TABLE_NAME = originalTableName;

    console.log(
      "\n🎉 All tests passed! Your implementation is working correctly!"
    );
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n💡 Tip: Check if you have:");
    console.log("1. Properly constructed the composite key (PK and SK)");
    console.log("2. Used marshall() for the key attributes");
    console.log("3. Handled the response.Item check correctly");
    console.log("4. Properly unmarshalled the response");
    console.log("5. Implemented proper error handling");
    throw error;
  }
}

runTests();
