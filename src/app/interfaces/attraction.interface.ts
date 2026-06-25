import { NearbyCampItem } from './camp.interface';

export interface AttractionDetailDto {
  id: number;
  attractionName: string;
  description: string;
  ticketInfo: string | null;
  estimatedMinutes: number | null;
  address: string | null;
  latitude: number;
  longitude: number;
  photoUrls: string[];
  nearbyCamps: NearbyCampItem[];
}
