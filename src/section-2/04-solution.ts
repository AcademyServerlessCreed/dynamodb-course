/*
DynamoDB PutItem Exercise - Product Creation

Goal: Learn how to create/update a product in DynamoDB table using the PutItem command 
with proper validation and error handling.

Scenario:
An e-commerce platform needs to implement a product creation system. When adding a new product,
the system needs to:
1. Validate all required fields
2. Format the composite keys correctly
3. Ensure no duplicate products
4. Handle errors appropriately

Key Concepts:
- Using composite keys (PK and SK) format
- Using marshall() to convert JavaScript objects to DynamoDB AttributeValue format
- Implementing conditional expressions to prevent overwrites
- Proper error handling and validation
- Consistent data formatting
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
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

// Product interface for type checking
interface Product {
  PK: string; // Format: PRODUCT#{productId}
  SK: string; // Format: METADATA#{productId}
  productId: string; // Unique identifier
  name: string;
  category: string; // Product category
  price: number; // Must be positive
  stock: number; // Must be non-negative
  lastUpdated: string; // ISO date format
  brand: string; // Must be from approved brands
}

// Response interface
interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}

/**
 * Product validation rules:
 * 1. All fields are required
 * 2. Price must be positive and have max 2 decimal places
 * 3. Stock must be non-negative integer
 * 4. PK must follow format PRODUCT#{productId}
 * 5. SK must follow format METADATA#{productId}
 * 6. lastUpdated must be valid ISO date
 * 7. brand must be from approved list: ["Apple", "Samsung", "Sony", "Nike", "Adidas"]
 *
 * Your task is to implement this function that puts a new product into DynamoDB
 */
const putProduct = async (product: Product): Promise<ProductResponse> => {
  try {
    // Validate all required fields
    const requiredFields: (keyof Product)[] = [
      "PK",
      "SK",
      "productId",
      "name",
      "category",
      "price",
      "stock",
      "lastUpdated",
      "brand",
    ];
    for (const field of requiredFields) {
      if (!product[field]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate price and stock
    if (
      product.price <= 0 ||
      !Number.isFinite(product.price) ||
      product.price.toFixed(2) !== product.price.toString()
    ) {
      return {
        success: false,
        error: "Price must be positive with max 2 decimal places",
      };
    }
    if (product.stock < 0 || !Number.isInteger(product.stock)) {
      return { success: false, error: "Stock must be a non-negative integer" };
    }

    // Validate PK/SK format
    if (
      !product.PK.startsWith("PRODUCT#") ||
      !product.SK.startsWith("METADATA#")
    ) {
      return { success: false, error: "Invalid PK or SK format" };
    }

    // Validate date format
    if (isNaN(Date.parse(product.lastUpdated))) {
      return { success: false, error: "Invalid date format" };
    }

    // Validate brand
    const approvedBrands = ["Apple", "Samsung", "Sony", "Nike", "Adidas"];
    if (!approvedBrands.includes(product.brand)) {
      return { success: false, error: "Invalid brand" };
    }

    const input: PutItemCommandInput = {
      TableName: TABLE_NAME,
      Item: marshall(product),
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
      ReturnValues: "ALL_OLD",
    };

    const response = await client.send(new PutItemCommand(input));
    return { success: true, data: product };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return { success: false, error: "Product already exists" };
    }
    return { success: false, error: error.message };
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for putProduct function...\n");

    // Test 1: Valid product creation
    console.log("Test 1: Creating a valid product");
    const validProduct: Product = {
      PK: "PRODUCT#101",
      SK: "METADATA#101",
      productId: "101",
      name: "Smartphone X",
      category: "Electronics",
      price: 599.99,
      stock: 50,
      lastUpdated: new Date().toISOString(),
      brand: "Samsung",
    };
    const result1 = await putProduct(validProduct);
    assert(
      result1.success === true,
      "❌ Failed: Should create product successfully"
    );
    console.log("✅ Passed: Product created successfully");

    // Test 2: Duplicate product
    console.log("\nTest 2: Attempting to create duplicate product");
    const result2 = await putProduct(validProduct);
    assert(
      result2.success === false,
      "❌ Failed: Should prevent duplicate creation"
    );
    console.log("✅ Passed: Duplicate prevented successfully");

    // Test 3: Invalid product (negative price)
    console.log("\nTest 3: Attempting to create product with negative price");
    const invalidProduct = {
      ...validProduct,
      productId: "102",
      PK: "PRODUCT#102",
      SK: "METADATA#102",
      price: -10.99,
    };
    const result3 = await putProduct(invalidProduct);
    assert(
      result3.success === false,
      "❌ Failed: Should reject negative price"
    );
    console.log("✅ Passed: Invalid price rejected");

    // Test 4: Invalid product (missing required field)
    console.log("\nTest 4: Attempting to create product with missing field");
    const incompleteProduct = { ...validProduct };
    delete (incompleteProduct as any).brand;
    const result4 = await putProduct(incompleteProduct);
    assert(
      result4.success === false,
      "❌ Failed: Should reject incomplete product"
    );
    console.log("✅ Passed: Incomplete product rejected");

    console.log(
      "\n🎉 All tests passed! Your implementation is working correctly!"
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.log("\n💡 Tip: Check if you have:");
    console.log("1. Implemented all validation rules");
    console.log("2. Properly constructed the PutItemCommand");
    console.log("3. Handled duplicate prevention correctly");
    console.log("4. Implemented proper error handling");
    console.log("5. Formatted the response correctly");
    throw error;
  }
}

// Run the tests
runTests();
