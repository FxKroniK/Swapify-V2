export interface Conversation {
  id: number;
  productId: string;
  buyerId: number;
  sellerId: number;
  messages: any[];
  status: string;
  proposalProductIds?: string;
  proposalCreditsOffered?: number;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  imageUrl?: string[];
  ownerId: number;
  category?: string;
  imageId?: string[];
  attributes?: { [key: string]: string };
  conversation?: Conversation;
  isFavorite?: boolean;
  favoriteCount?: number;
  latitude?: number;
  longitude?: number;
  ownerLocation?: string;
  ownerUsername?: string;
  ownerRating?: number;
  ownerReviewCount?: number;
}

export interface CreateProductDto {
  title: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string[];
  imageId: string[];
  attributes: { [key: string]: string };
}