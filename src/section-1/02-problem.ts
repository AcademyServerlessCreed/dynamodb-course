// problem.ts
/*
DynamoDB Scan Exercise

Goal: Learn how to retrieve all Pokemons from a DynamoDB table using the Scan command.

Key Concepts:
- Scan operation retrieves all items from a DynamoDB table
- unmarshall(Item) converts DynamoDB's AttributeValue format back to regular object
- response.Items is an array of DynamoDB items that needs to be unmarshalled
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import assert from "assert";
import {
  REGION,
  SECTION_1_ACCESS_KEY,
  SECTION_1_SECRET_KEY,
  SECTION_1_TABLE_NAME,
} from "../prodkey";

// Pre-initialized DynamoDB client
const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: SECTION_1_ACCESS_KEY,
    secretAccessKey: SECTION_1_SECRET_KEY,
  },
});

const getAllPokemons = async (): Promise<any[]> => {
  try {
    // TODO: Create the ScanCommandInput object
    // Hint: ScanCommandInput requires TableName
    const input: ScanCommandInput = {
      // Fill in the input properties
      TableName: SECTION_1_TABLE_NAME,
    };

    // TODO: Execute the ScanCommand
    // Hint: The response will be of type ScanCommandOutput
    const response = // Create and send the ScanCommand

    // TODO: Handle the response
    // Hint 1: Check if response.Items exists and has length > 0
    // Hint 2: Use unmarshall() on each item in response.Items
    // Hint 3: Return the array of unmarshalled items or empty array
  

  } catch (error) {
    console.error("Error fetching Pokemons:", error);
    throw error;
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for getAllPokemons function...\n");

    // Test 1: Retrieving all Pokemons
    console.log("Test 1: Fetching all Pokemons");
    const result = await getAllPokemons();

    // Check if result is an array
    assert(Array.isArray(result), "❌ Failed: Result should be an array");

    // Check if array is not empty
    assert(
      result.length > 0,
      "❌ Failed: Should retrieve at least one Pokemon"
    );

    // Check if items have correct structure
    assert(result[0].id !== undefined, "❌ Failed: Pokemon should have an id");
    assert(
      result[0].Name !== undefined,
      "❌ Failed: Pokemon should have a name"
    );
    assert(
      result[0].Defense !== undefined,
      "❌ Failed: Pokemon should have a defense"
    );
    assert(
      result[0].Attack !== undefined,
      "❌ Failed: Pokemon should have an attack"
    );
    assert(result[0].HP !== undefined, "❌ Failed: Pokemon should have an HP");

    console.log("✅ Passed: Successfully retrieved all Pokemons");
    console.log(`📦 Retrieved ${result.length} Pokemons`);
    console.log("📦 First Pokemon:", result[0]);

    console.log("\n-------------------\n");
    console.log(
      "🎉 All tests passed! Your implementation is working correctly!"
    );
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\n💡 Tip: Check if you have:");
    console.log("1. Used the correct TableName");
    console.log("2. Properly executed the ScanCommand");
    console.log("3. Correctly unmarshalled all items in the response");
    console.log("4. Returned an array of unmarshalled items");
    throw error;
  }
}


// Run the tests
runTests();