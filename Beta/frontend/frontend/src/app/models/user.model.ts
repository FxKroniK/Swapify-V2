export interface UserDto {
  id: number;
  usermail: string;
  nickname: string;
  credits: number;
  profilePictureUrl?: string; // Opcional, como en LoginComponent
}

export interface UserProfile {
  id: number;
  usermail: string;
  aboutMe: string;
  locationName?: string | null | undefined; // Permitir null para coincidir con municipio
  latitude?: number;
  longitude?: number;
  nickname: string;
  profilePictureUrl: string;
  profilePictureId: string;
  rating: number;
  reviewCount: number;
}