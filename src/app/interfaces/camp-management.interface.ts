// ===== CampManagement：業主上架管理 =====

export interface CampgroundCreateDto {
  name: string;
  phone: string;
  elevation: number;
  description: string;
  website: string;
  basePrice: number;
  area: string;
  latitude: number;
  longitude: number;
  rules: string;
  highlights: string[];
  facilityIds: number[];
  tagIds: number[];
}

export interface CampgroundListItemDto {
  id: number;
  name: string;
  status: number;
  isDeleted: boolean;
  createdAt: string;
  zoneCount: number;
  siteCount: number;
  coverImageUrl: string | null;
}

export interface CampgroundOwnerDetailDto {
  id: number;
  name: string;
  phone: string;
  elevation: number;
  description: string;
  status: number;
  isDeleted: boolean;
  createdAt: string;
  website: string;
  basePrice: number;
  area: string;
  latitude: number;
  longitude: number;
  rules: string;
  highlights: string[];
  facilityIds: number[];
  tagIds: number[];
  zones: CampzoneListItemDto[];
}

export interface CampPricingDto {
  id: number; // 0 = 新建
  weekdayPrice: number;
  weekendPrice: number;
}

export interface CampzoneCreateDto {
  zoneName: string;
  zoneDescription: string;
  geoJson: string;
  zoneType: number; // 見下方 CampzoneType
  pricing: CampPricingDto;
  facilityIds: number[];
}

export interface CampzoneListItemDto {
  id: number;
  campgroundId: number;
  zoneName: string;
  zoneDescription: string;
  geoJson: string;
  zoneType: number;
  pricing: CampPricingDto | null;
  siteCount: number;
}

export interface CampsiteCreateDto {
  siteNumber: string;
  capacityPeople: number;
  description: string;
  facilityIds: number[];
}

export interface CampsiteUpdateDto {
  siteNumber: string;
  capacityPeople: number;
  siteStatus: number;
  description: string;
  facilityIds: number[];
}

export interface CampsiteListItemDto {
  id: number;
  zoneId: number;
  siteNumber: string;
  capacityPeople: number;
  siteStatus: number;
  description: string;
}

export interface CampMediumDto {
  id: number;
  url: string; // 相對路徑（/uploads/Campground/xxx.jpg），顯示圖片時要自行拼主機，例如 https://localhost:7011 + url
  isCover: boolean;
}

// 固定兩選項，對應後端 Common/CampzoneType.cs
export enum CampzoneType {
  BringOwnGear = 0,        // 自帶露營裝備
  OnSiteAccommodation = 1, // 園區住宿
}

// 對應後端 CampManagementService 的狀態常數
export enum CampgroundStatus {
  Draft = 0,
  Active = 1,
}
