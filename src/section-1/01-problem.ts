// problem.ts
/*
DynamoDB GetItem Exercise

Goal: Learn how to retrieve a Pokemon by its ID from a DynamoDB table using the GetItem command.


Key Concepts:
- marshall({ id }) converts { id: "1" } into DynamoDB's AttributeValue format
- unmarshall(Item) converts DynamoDB's AttributeValue format back to regular object
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
  SECTION_1_ACCESS_KEY,
  SECTION_1_SECRET_KEY,
  SECTION_1_TABLE_NAME,
} from "../key";

// Pre-initialized DynamoDB client
const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: SECTION_1_ACCESS_KEY,
    secretAccessKey: SECTION_1_SECRET_KEY,
  },
});

// Define Pokemon interface for better type checking


const getPokemonById = async (id: string): Promise<any> => {
  try {
    // TODO: Create the GetItemCommandInput object
    // Hint 1: This should match the GetItemCommandInput interface
    // Hint 2: Use marshall({ id }) to convert the key into DynamoDB format
    const input: GetItemCommandInput = {
      // Fill in the input properties
    };

    // TODO: Execute the GetItemCommand
    // Hint: The response will be of type GetItemCommandOutput
    const response = // Create and send the GetItemCommand

    // TODO: Handle the response
    // Hint 1: Check if response.Item exists
    // Hint 2: Use unmarshall(response.Item) to convert DynamoDB format to Pokemon
    // Hint 3: Return the unmarshalled item or null
    
  } catch (error) {
    console.error("Error fetching Pokemon:", error);
    throw error;
  }
};

// Test cases
async function runTests() {
  try {
    console.log('\n🚀 Starting tests for getPokemonById function...\n');

    // Test 1: Valid Pokemon ID
    console.log('Test 1: Fetching Pokemon with ID "1"');
    const result1 = await getPokemonById("1"); // play around with the id upto 150
    assert(result1 !== null, '❌ Failed: Pokemon with ID 1 should be found');
    console.log('✅ Passed: Successfully retrieved Pokemon with ID "1"');
    console.log('📦 Received:', result1);

    console.log('\n-------------------\n');

    // Test 2: Invalid Pokemon ID
    console.log('Test 2: Fetching non-existent Pokemon with ID "999999"');
    const result2 = await getPokemonById("999999");
    assert(result2 === null, '❌ Failed: Non-existent Pokemon should return null');
    console.log('✅ Passed: Correctly handled non-existent Pokemon');

    console.log('\n-------------------\n');
    console.log('🎉 All tests passed! Your implementation is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Tip: Check if you have:');
    console.log('1. Used the correct TableName');
    console.log('2. Properly marshalled the key');
    console.log('3. Correctly unmarshalled the response');
    console.log('4. Returned the unmarshalled item or null');
    throw error;
  }
}

// Run the tests
runTests();
