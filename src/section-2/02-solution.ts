import {
  DynamoDBClient,
  QueryCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Product, ProductListResponse, ProductQueryParams } from "./types";
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

async function searchProductsByCategory(
  params: ProductQueryParams
): Promise<ProductListResponse> {
  try {
    // Initialize KeyConditionExpression and ExpressionAttributeValues
    let keyConditionExpression = "category = :category";
    let expressionAttributeValues: Record<string, AttributeValue> = {
      ":category": { S: params.category }, // Directly create AttributeValue
    };

    // Add price range if provided
    if (params.priceRange) {
      keyConditionExpression = "category = :category AND price BETWEEN :minPrice AND :maxPrice";
      expressionAttributeValues = {
        ":category": { S: params.category },
        ":minPrice": { S: params.priceRange.min.toString().padStart(10, '0') },
        ":maxPrice": { S: params.priceRange.max.toString().padStart(10, '0') }
      };
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "CategoryPriceIndex",
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: {
        "#n": "name"
      },
      Limit: params.limit || 20,
      ExclusiveStartKey: params.lastEvaluatedKey,
      ProjectionExpression: "productId, #n, price, stock, brand",
      ScanIndexForward: true,
    });

    const response = await client.send(command);

    // Transform response items
    const products = response.Items
      ? response.Items.map((item) => {
          const unmarshalled = unmarshall(item);
          return {
            productId: unmarshalled.productId,
            price: unmarshalled.price,
            stock: unmarshalled.stock,
            brand: unmarshalled.brand,
          } as Product;
        })
      : [];

    return {
      success: true,
      data: products,
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  } catch (error: any) {
    console.error("Query error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
async function runTests() {
  try {
    console.log(
      "\n🚀 Starting tests for searchProductsByCategory function...\n"
    );

    // Test 1: Basic category search
    console.log("Test 1: Search Electronics category");
    const result1 = await searchProductsByCategory({
      category: "Electronics",
      limit: 5,
    });
    assert(result1.success === true, "❌ Failed: Should return success");
    assert(
      Array.isArray(result1.data),
      "❌ Failed: Should return array of products"
    );
    assert(
      result1.data!.length <= 5,
      "❌ Failed: Should respect limit parameter"
    );
    console.log("✅ Passed: Basic category search");
    console.log("📦 First page results:", result1.data);

    console.log("\n-------------------\n");

    // Test 2: Category search with price range
    console.log("Test 2: Search Electronics with price range $500-$1000");
    const result2 = await searchProductsByCategory({
      category: "Electronics",
      priceRange: { min: 500, max: 1000 },
      limit: 5,
    });
    assert(result2.success === true, "❌ Failed: Should return success");
    assert(
      result2.data!.every((p) => p.price >= 500 && p.price <= 1000),
      "❌ Failed: All products should be within price range"
    );
    console.log("✅ Passed: Price range filtering");
    console.log("📦 Price filtered results:", result2.data);

    console.log("\n-------------------\n");

    // Test 3: Pagination
    console.log("Test 3: Testing pagination");
    const firstPage = await searchProductsByCategory({
      category: "Electronics",
      limit: 2,
    });

    assert(
      firstPage.lastEvaluatedKey !== undefined,
      "❌ Failed: Should have LastEvaluatedKey for pagination"
    );

    const secondPage = await searchProductsByCategory({
      category: "Electronics",
      limit: 2,
      lastEvaluatedKey: firstPage.lastEvaluatedKey,
    });

    assert(
      JSON.stringify(firstPage.data![0]) !==
        JSON.stringify(secondPage.data![0]),
      "❌ Failed: Second page should have different items"
    );
    console.log("✅ Passed: Pagination test");
    console.log("📦 First page:", firstPage.data);
    console.log("📦 Second page:", secondPage.data);

    console.log("\n-------------------\n");

    // Test 4: Non-existent category
    console.log("Test 4: Search non-existent category");
    const result4 = await searchProductsByCategory({
      category: "NonExistentCategory",
      limit: 5,
    });
    assert(result4.success === true, "❌ Failed: Should return success");
    assert(result4.data!.length === 0, "❌ Failed: Should return empty array");
    console.log("✅ Passed: Non-existent category handling");

    console.log("\n-------------------\n");
    console.log(
      "🎉 All tests passed! Your implementation is working correctly!"
    );
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n💡 Tip: Check if you have:");
    console.log("1. Properly constructed the KeyConditionExpression");
    console.log("2. Correctly handled price range filtering");
    console.log("3. Implemented pagination correctly");
    console.log("4. Used the correct GSI (CategoryPriceIndex)");
    console.log("5. Properly marshalled/unmarshalled the data");
    throw error;
  }
}

runTests();
