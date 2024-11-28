/*
DynamoDB BatchRead Exercise - Streaming Platform Analytics

Goal: Learn how to efficiently retrieve multiple items from DynamoDB using BatchGetItem
with proper handling of partial responses and retries.

Scenario:
A streaming platform needs to generate analytics reports that require fetching multiple
user profiles and their viewing histories simultaneously. The system needs to:
1. Fetch multiple user profiles in a single operation
2. Retrieve viewing histories for these users
3. Handle partial responses (unprocessed keys)
4. Implement proper error handling
5. Format the data for analytics processing

Key Concepts:
- Using BatchGetItem for multiple record retrieval
- Handling unprocessed keys with retries
- Processing multiple record types (profiles and viewing history)
- Error handling and response formatting
- Working with composite keys in batch operations
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchGetItemCommand,
  BatchGetItemCommandInput,
  BatchGetItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import assert from "assert";


// Response interface for batch get operation
interface UserAnalyticsData {
  userId: string;
  name: string;
  subscriptionTier: string;
  viewingHistory: {
    movieId: string;
    watchDuration: number;
    completed: boolean;
    watchDate: string;
  }[];
}

interface BatchReadResponse {
  success: boolean;
  message?: string;
  data?: UserAnalyticsData[];
  error?: string;
}

/**
 * Batch Read Operation Requirements:
 *
 * 1. Input Validation:
 *    - Verify userIds array is non-empty
 *    - Validate each userId format
 *    - Limit batch size to 100 items
 *
 * 2. DynamoDB Operation:
 *    - Construct BatchGetItem input for both profiles and viewing histories
 *    - Handle partial responses (UnprocessedKeys)
 *    - Implement retry logic for unprocessed keys
 *
 * 3. Error Handling:
 *    - Handle validation errors
 *    - Handle DynamoDB errors
 *    - Handle timeout scenarios
 *
 * 4. Response Processing:
 *    - Combine profile and viewing history data
 *    - Format response according to UserAnalyticsData interface
 *    - Handle missing or incomplete data
 */

const getUserAnalytics = async (
  userIds: string[]
): Promise<BatchReadResponse> => {
  try {
    // TODO: Implement input validation
    // Hint 1: Check if userIds array is valid
    // Hint 2: Validate each userId format
    // Hint 3: Check batch size limits
    // TODO: Create BatchGetItemCommandInput
    // Hint 1: Format keys for both profiles and viewing histories
    // Hint 2: Structure RequestItems object correctly
    // TODO: Implement retry logic for unprocessed keys
    // Hint 1: Track unprocessed keys
    // Hint 2: Implement exponential backoff
    // Hint 3: Handle retry limits
    // TODO: Process and combine the results
    // Hint 1: Merge profile and viewing history data
    // Hint 2: Format according to UserAnalyticsData interface
    // Hint 3: Handle missing data scenarios
    // TODO: Return formatted response
  } catch (error) {
    // TODO: Implement error handling
    // Hint 1: Handle specific DynamoDB exceptions
    // Hint 2: Format error responses appropriately
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting tests for getUserAnalytics function...\n");

    // Test 1: Fetch data for multiple valid users
    console.log("Test 1: Fetching data for multiple users");
    const result1 = await getUserAnalytics(["1001", "1002", "1003"]);
    assert(
      result1.success === true,
      "❌ Failed: Should fetch user data successfully"
    );
    assert(
      result1.data?.length === 3,
      "❌ Failed: Should return data for all users"
    );
    console.log("✅ Passed: Successfully retrieved multiple user data");
    console.log("📊 Sample data:", result1.data?.[0]);

    // Test 2: Handle invalid user IDs
    console.log("\nTest 2: Testing with invalid user IDs");
    const result2 = await getUserAnalytics(["invalid_id"]);
    assert(
      result2.success === false,
      "❌ Failed: Should handle invalid IDs properly"
    );
    console.log("✅ Passed: Properly handled invalid user IDs");

    // Test 3: Handle empty input array
    console.log("\nTest 3: Testing with empty input");
    const result3 = await getUserAnalytics([]);
    assert(
      result3.success === false,
      "❌ Failed: Should reject empty input array"
    );
    console.log("✅ Passed: Empty input handled correctly");

    // Additional test cases can be added here

    console.log(
      "\n🎉 All tests passed! Your implementation is working correctly!"
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.log("\n💡 Debug Tips:");
    console.log("1. Check BatchGetItem input formatting");
    console.log("2. Verify unprocessed keys handling");
    console.log("3. Confirm response data merging logic");
    console.log("4. Review error handling implementation");
    console.log("5. Validate retry logic");
    throw error;
  }
}

runTests();
