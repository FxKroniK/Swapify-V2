// src/app/models/review.model.ts
export interface Review {
  id: number;
  reviewerId: number;
  reviewedUserId: number;
  rating: number;
  comment: string;
  createdAt: string;
  productId: string;
}

export interface ReviewDTO {
  reviewerId: number;
  reviewedUserId: number;
  rating: number;
  comment: string;
  productId: string;
}

export interface RevieweableProductDto {
  productId: string;
  title: string;
  description: string;
  imageUrl: string;
  reviewerId: number;
  reviewedUserId: number;
}