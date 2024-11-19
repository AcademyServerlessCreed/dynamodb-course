import { AttributeValue } from "@aws-sdk/client-dynamodb";

// Common interfaces
export interface Product {
  PK: string;
  SK: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lastUpdated: string;
  brand: string;
  supplier: string;
  salesVelocity?: number;
}

// DynamoDB attribute types
export type DynamoDBProduct = Record<string, AttributeValue>;

// Response interfaces
export interface ProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}

export interface ProductListResponse {
  success: boolean;
  data?: Product[];
  lastEvaluatedKey?: Record<string, AttributeValue>;
  error?: string;
}

// Request interfaces
export type UpdateStockRequest = {
  productId: string;
  quantity: number;
  operation: "add" | "subtract";
  updatedBy: string;
};

export interface PriceRange {
  min: number;
  max: number;
}

export interface ProductQueryParams {
  category: string;
  priceRange?: PriceRange;
  lastEvaluatedKey?: Record<string, AttributeValue>;
  limit?: number;
}
