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
import {
  REGION,
  SECTION_3_ACCESS_KEY,
  SECTION_3_SECRET_KEY,
  SECTION_3_TABLE_NAME,
} from "../key";

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

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: SECTION_3_ACCESS_KEY,
    secretAccessKey: SECTION_3_SECRET_KEY,
  },
});

const TABLE_NAME = SECTION_3_TABLE_NAME;

// Helper function to format user IDs into proper DynamoDB keys
const formatUserKeys = (userIds: string[]) => {
  return userIds.map((userId) => ({
    PK: { S: `USER#${userId}` },
    SK: { S: `PROFILE#${userId}` },
  }));
};

// Helper function to format viewing history keys
const formatViewingHistoryKeys = (userIds: string[]) => {
  return userIds.map((userId) => ({
    PK: { S: `USER#${userId}` },
    SK: { S: `VIEWING#` },
  }));
};

// Helper function for exponential backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getUserAnalytics = async (
  userIds: string[]
): Promise<BatchReadResponse> => {
  try {
    // Input validation
    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        error: "User IDs array cannot be empty",
      };
    }

    if (userIds.length > 100) {
      return {
        success: false,
        error: "Cannot process more than 100 items in a batch",
      };
    }

    // Validate each userId format
    if (!userIds.every((id) => /^\d+$/.test(id))) {
      return {
        success: false,
        error: "Invalid user ID format detected",
      };
    }

    // Initial BatchGet request
    let unprocessedKeys = true;
    let retryCount = 0;
    const maxRetries = 3;
    let allProfiles: any[] = [];
    let allViewingHistories: any[] = [];

    while (unprocessedKeys && retryCount < maxRetries) {
      const input: BatchGetItemCommandInput = {
        RequestItems: {
          [TABLE_NAME]: {
            Keys: [
              ...formatUserKeys(userIds),
              ...formatViewingHistoryKeys(userIds),
            ],
          },
        },
      };

      const response: BatchGetItemCommandOutput = await client.send(
        new BatchGetItemCommand(input)
      );

      // Process received items
      if (response.Responses && response.Responses[TABLE_NAME]) {
        const items = response.Responses[TABLE_NAME].map((item) =>
          unmarshall(item)
        );

        // Separate profiles and viewing histories
        items.forEach((item) => {
          if (item.SK.startsWith("PROFILE#")) {
            allProfiles.push(item);
          } else if (item.SK.startsWith("VIEWING#")) {
            allViewingHistories.push(item);
          }
        });
      }

      // Check for unprocessed keys
      if (
        response.UnprocessedKeys &&
        Object.keys(response.UnprocessedKeys).length > 0
      ) {
        retryCount++;
        await sleep(Math.pow(2, retryCount) * 100); // Exponential backoff
      } else {
        unprocessedKeys = false;
      }
    }

    // Format the final response
    const formattedData: UserAnalyticsData[] = allProfiles.map((profile) => {
      const userId = profile.PK.replace("USER#", "");
      const userViewingHistory = allViewingHistories
        .filter((vh) => vh.PK === profile.PK)
        .map((vh) => ({
          movieId: vh.movie_id,
          watchDuration: vh.watch_duration,
          completed: vh.completed,
          watchDate: vh.SK.split("#")[1],
        }));

      return {
        userId,
        name: profile.name,
        subscriptionTier: profile.subscription_tier,
        viewingHistory: userViewingHistory,
      };
    });

    return {
      success: true,
      data: formattedData,
      message: unprocessedKeys
        ? "Some items could not be retrieved after maximum retries"
        : "All items retrieved successfully",
    };
  } catch (error) {
    console.error("Error in getUserAnalytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
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
