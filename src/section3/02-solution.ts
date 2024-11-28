/*
DynamoDB BatchWrite Exercise - Content Library Expansion

Goal: Implement a batch content upload system for a streaming platform to efficiently 
add new movies, series, and their associated metadata in bulk.

Scenario:
A streaming platform is expanding its content library by adding multiple new movies 
and series. For each piece of content, we need to:
1. Add the main content metadata
2. Initialize viewing statistics
3. Create season/episode entries for series
4. Track content language availability
5. Handle content categorization

Key Concepts:
- Efficient batch writing of related items
- Managing composite keys
- Handling unprocessed items
- Implementing retry logic
- Validating complex nested structures
*/

// Types and Interfaces
interface ContentMetadata {
  id: string;
  title: string;
  type: "MOVIE" | "SERIES";
  genre: string[];
  releaseYear: number;
  rating: string;
  languages: {
    audio: string[];
    subtitles: string[];
  };
  duration: number;
  director?: string; // for movies
  creator?: string; // for series
  cast: string[];
}

interface SeriesEpisode {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: number;
  synopsis: string;
}

interface ContentStats {
  contentId: string;
  initialTrending: number;
  releasePopularity: number;
  targetDemographic: string[];
  languageAvailability: number;
}

interface BatchWriteContentResponse {
  success: boolean;
  message?: string;
  processedItems: {
    metadata: number;
    episodes: number;
    stats: number;
  };
  unprocessedItems?: {
    itemId: string;
    type: "metadata" | "episode" | "stats";
    reason: string;
  }[];
  error?: string;
}

/**
 * Implementation Requirements:
 *
 * 1. Input Validation:
 *    - Validate all required fields in content metadata
 *    - Verify series episodes consistency
 *    - Validate language codes
 *    - Check content ratings format
 *
 * 2. Batch Processing:
 *    - Group items into batches of 25
 *    - Process content and stats together
 *    - Handle series episodes efficiently
 *    - Manage related items in same batch
 *
 * 3. Error Handling:
 *    - Implement retries for unprocessed items
 *    - Track partial batch failures
 *    - Validate input data structures
 *    - Handle DynamoDB capacity exceptions
 *
 * 4. Response Handling:
 *    - Track successful writes by category
 *    - Provide detailed failure information
 *    - Format response for monitoring
 */

import { BatchWriteItemCommand, BatchWriteItemCommandInput, BatchWriteItemCommandOutput, DynamoDBClient } from "@aws-sdk/client-dynamodb";
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

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: SECTION_3_ACCESS_KEY,
    secretAccessKey: SECTION_3_SECRET_KEY,
  },
});

const TABLE_NAME = SECTION_3_TABLE_NAME;

// Helper function for input validation
const validateInputs = (
  content: ContentMetadata[],
  episodes: SeriesEpisode[],
  stats: ContentStats[]
): string | null => {
  // Basic validation
  if (!content.length) return "No content items provided";
  if (content.length > 25)
    return "Batch size exceeds maximum limit of 25 items";

  // Validate content items
  for (const item of content) {
    if (!item.id || !item.title || !item.type) {
      return `Invalid content item: Missing required fields for ${
        item.id || "unknown"
      }`;
    }

    if (item.type === "SERIES") {
      const seriesEpisodes = episodes.filter((ep) => ep.seriesId === item.id);
      if (!seriesEpisodes.length) {
        return `No episodes provided for series ${item.id}`;
      }
    }

    // Validate corresponding stats
    if (!stats.some((stat) => stat.contentId === item.id)) {
      return `Missing stats for content ${item.id}`;
    }
  }

  return null;
};

// Helper function to format items for BatchWrite
const formatBatchWriteItems = (
  content: ContentMetadata[],
  episodes: SeriesEpisode[],
  stats: ContentStats[]
) => {
  const batchItems: any[] = [];

  content.forEach((item) => {
    // Add content metadata
    batchItems.push({
      PutRequest: {
        Item: marshall({
          PK: item.id,
          SK: "METADATA",
          entity_type: item.type,
          title: item.title,
          genre: item.genre,
          release_year: item.releaseYear,
          rating: item.rating,
          languages: item.languages,
          duration: item.duration,
          ...(item.director && { director: item.director }),
          ...(item.creator && { creator: item.creator }),
          cast: item.cast,
        }),
      },
    });

    // Add stats
    const itemStats = stats.find((stat) => stat.contentId === item.id);
    if (itemStats) {
      batchItems.push({
        PutRequest: {
          Item: marshall({
            PK: item.id,
            SK: "STATS",
            entity_type: `${item.type}_STATS`,
            initial_trending: itemStats.initialTrending,
            release_popularity: itemStats.releasePopularity,
            target_demographic: itemStats.targetDemographic,
            language_availability: itemStats.languageAvailability,
            total_views: 0,
            average_rating: 0,
            completion_rate: 0,
          }),
        },
      });
    }

    // Add episodes for series
    if (item.type === "SERIES") {
      const seriesEpisodes = episodes.filter((ep) => ep.seriesId === item.id);
      seriesEpisodes.forEach((episode) => {
        batchItems.push({
          PutRequest: {
            Item: marshall({
              PK: item.id,
              SK: `EPISODE#S${episode.seasonNumber
                .toString()
                .padStart(2, "0")}E${episode.episodeNumber
                .toString()
                .padStart(2, "0")}`,
              entity_type: "EPISODE",
              title: episode.title,
              duration: episode.duration,
              synopsis: episode.synopsis,
              season_number: episode.seasonNumber,
              episode_number: episode.episodeNumber,
            }),
          },
        });
      });
    }
  });

  return batchItems;
};

// Helper function to chunk array into batches of 25
const chunkArray = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, (i + 1) * size)
  );
};

// Main function implementation
const batchAddContent = async (
  content: ContentMetadata[],
  episodes: SeriesEpisode[],
  stats: ContentStats[]
): Promise<BatchWriteContentResponse> => {
  try {
    // Validate inputs
    const validationError = validateInputs(content, episodes, stats);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        processedItems: {
          metadata: 0,
          episodes: 0,
          stats: 0,
        },
      };
    }

    // Format items for batch writing
    const batchItems = formatBatchWriteItems(content, episodes, stats);
    const itemChunks = chunkArray(batchItems, 25);

    // Track progress
    let processedCount = {
      metadata: 0,
      episodes: 0,
      stats: 0,
    };
    let unprocessedItems: any[] = [];

    // Process each chunk
    for (const chunk of itemChunks) {
      let retryCount = 0;
      let unprocessedChunk = chunk;

      while (unprocessedChunk.length > 0 && retryCount < 3) {
        const input: BatchWriteItemCommandInput = {
          RequestItems: {
            [TABLE_NAME]: unprocessedChunk,
          },
        };

        try {
          const response: BatchWriteItemCommandOutput = await client.send(
            new BatchWriteItemCommand(input)
          );

          // Count processed items
          const processedItems =
            unprocessedChunk.length -
            (response.UnprocessedItems?.[TABLE_NAME]?.length || 0);

          unprocessedChunk = response.UnprocessedItems?.[TABLE_NAME] || [];

          // Update counts
          unprocessedChunk.forEach((item) => {
            const sk = item.PutRequest.Item.SK.S;
            if (sk === "METADATA") processedCount.metadata++;
            else if (sk.startsWith("EPISODE#")) processedCount.episodes++;
            else if (sk === "STATS") processedCount.stats++;
          });

          if (unprocessedChunk.length > 0) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 100)
            );
          }
        } catch (error) {
          console.error("Error processing chunk:", error);
          unprocessedItems = [...unprocessedItems, ...unprocessedChunk];
          break;
        }
      }

      // Add any remaining unprocessed items after retries
      if (unprocessedChunk.length > 0) {
        unprocessedItems = [...unprocessedItems, ...unprocessedChunk];
      }
    }

    // Prepare response
    return {
      success: unprocessedItems.length === 0,
      message:
        unprocessedItems.length === 0
          ? "All items processed successfully"
          : "Some items were not processed",
      processedItems: processedCount,
      unprocessedItems: unprocessedItems.map((item) => ({
        itemId: item.PutRequest.Item.PK.S,
        type:
          item.PutRequest.Item.SK.S === "METADATA"
            ? "metadata"
            : item.PutRequest.Item.SK.S === "STATS"
            ? "stats"
            : "episode",
        reason: "Failed after maximum retries",
      })),
    };
  } catch (error) {
    console.error("Error in batchAddContent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      processedItems: {
        metadata: 0,
        episodes: 0,
        stats: 0,
      },
    };
  }
};

// Test cases
async function runTests() {
  try {
    console.log("\n🚀 Starting content upload tests...\n");

    // Test Data
    const newContent: ContentMetadata[] = [
      {
        id: "MOVIE#106",
        title: "Digital Frontier",
        type: "MOVIE",
        genre: ["Sci-Fi", "Adventure"],
        releaseYear: 2024,
        rating: "PG-13",
        languages: {
          audio: ["English", "Spanish"],
          subtitles: ["English", "Spanish", "French"],
        },
        duration: 7200,
        director: "Director6",
        cast: ["Actor10", "Actor11"],
      },
      {
        id: "SERIES#204",
        title: "Code Masters",
        type: "SERIES",
        genre: ["Drama", "Technology"],
        releaseYear: 2024,
        rating: "TV-14",
        languages: {
          audio: ["English"],
          subtitles: ["English", "Spanish", "French"],
        },
        duration: 3600,
        creator: "Creator4",
        cast: ["Actor12", "Actor13"],
      },
    ];

    const seriesEpisodes: SeriesEpisode[] = [
      {
        seriesId: "SERIES#204",
        seasonNumber: 1,
        episodeNumber: 1,
        title: "The First Commit",
        duration: 3600,
        synopsis: "A team of developers face their first challenge",
      },
      {
        seriesId: "SERIES#204",
        seasonNumber: 1,
        episodeNumber: 2,
        title: "Debug Mode",
        duration: 3600,
        synopsis: "The team discovers a critical bug",
      },
    ];

    const contentStats: ContentStats[] = [
      {
        contentId: "MOVIE#106",
        initialTrending: 85,
        releasePopularity: 90,
        targetDemographic: ["18-34", "Tech-Savvy"],
        languageAvailability: 3,
      },
      {
        contentId: "SERIES#204",
        initialTrending: 75,
        releasePopularity: 80,
        targetDemographic: ["25-45", "Professionals"],
        languageAvailability: 3,
      },
    ];

    // Test 1: Add new content batch
    console.log("Test 1: Adding new content batch");
    const result = await batchAddContent(
      newContent,
      seriesEpisodes,
      contentStats
    );
    assert(
      result.success === true,
      "❌ Failed: Should add content successfully"
    );
    console.log("✅ Passed: Content batch added successfully");
    console.log("📊 Processing summary:", result.processedItems);

    // Additional test cases...

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

runTests();
