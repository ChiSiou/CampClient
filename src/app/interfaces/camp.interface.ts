// ===== Phase 1：首頁 =====

export interface HomeFeedDto {
  announcements: AnnouncementItem[];
  featuredCamps: CampSearchResultDto[];
}

export interface AnnouncementItem {
  id: number;
  title: string;
  imageUrl: string | null;
  publishedDate: string;
  linkUrl: string | null;
}

// ===== Phase 2：搜尋 =====

export interface CampSearchResultDto {
  id: number;
  name: string;
  area: string;
  basePrice: number;
  averageRating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  isLiked: boolean;
  imageUrls: string[];
  highlights: string[];
  elevation: number;
  tags: string[];
}

export interface CampSearchRequest {
  keyword?: string;
  area?: string;
  checkInDate?: string;
  checkOutDate?: string;
  southWestLat?: number;
  southWestLng?: number;
  northEastLat?: number;
  northEastLng?: number;
  zoom?: number;
  requirements?: RequirementItem[];
  tagIds?: number[];
  facilityIds?: number[];
  minElevation?: number;
  minRating?: number;
  sortBy?: 'Recommended' | 'PriceAsc' | 'PriceDesc' | 'RatingDesc' | 'ElevationAsc' | 'ElevationDesc';
  pageNumber?: number;
  pageSize?: number;
}

export interface RequirementItem {
  itemId: number;
  quantity: number;
}

export interface CampSearchOption {
  id: number;
  itemName: string;
  category: number;  // 1=自帶裝備, 2=免裝備
}

export interface CampSearchResponseDto {
  totalCount: number;
  sortBy: string;
  results: CampSearchResultDto[];
}

export interface CampMapResponseDto {
  isClustered: boolean;
  clusters: MapClusterItem[] | null;
  markers: CampMapMarkerDto[] | null;
}

export interface MapClusterItem {
  latitude: number;
  longitude: number;
  count: number;
}

export interface CampMapMarkerDto {
  id: number;
  latitude: number;
  longitude: number;
  basePrice: number;
  name: string;
  area: string;
  coverImageUrl: string | null;
  averageRating: number;
  reviewCount: number;
}

export interface CampFilterDto {
  environmentTags: FilterTagItem[];
  policyTags: FilterTagItem[];
  facilityTags: FilterTagItem[];
}

export interface FilterTagItem {
  tagId: number;
  tagName: string;
  iconClass: string;
}

// ===== Phase 3：營區詳細頁 =====

export interface CampDetailDto {
  id: number;
  name: string;
  phone: string;
  elevation: number;
  website: string;
  latitude: number;
  longitude: number;
  description: string;
  rules: string;
  imageUrls: string[];
  highlights: string[];
  tags: CampDetailTagItem[];
}

export interface CampDetailTagItem {
  tagName: string;
  category: string;
  iconUrl: string;
}

export interface CampLocationDto {
  fullAddress: string;
  targetLatitude: number;
  targetLongitude: number;
}

export interface CampMapZoneDto {
  zoneId: number;
  zoneName: string;
  zoneDescription: string;
  geoJson: string;
  zoneType: number; // 1=Generic草地, 2=UniqueUnit小木屋
  weekdayPrice: number;
  weekendPrice: number;
  totalSites: number;
  availableSites: number | null;
  nearbyFacilities: ZoneFacilityItem[];
}

export interface ZoneFacilityItem {
  facilityName: string;
  iconUrl: string;
}

// ===== Phase 3b：周邊探索 =====

export interface CampExplorationDto {
  nearbyAttractions: NearbyAttractionItem[];
  nearbyCamps: NearbyCampItem[];
}

export interface NearbyAttractionItem {
  id: number;
  attractionName: string;
  ticketInfo: string;
  estimatedMinutes: number | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  coverImageUrl: string | null;
}

export interface NearbyCampItem {
  id: number;
  name: string;
  basePrice: number;
  coverImageUrl: string | null;
  distanceKm: number;
  averageRating: number;
  latitude: number;
  longitude: number;
}

// ===== Phase 4：日曆/選位 =====

export interface CampMutiCalendarDto {
  matrixDates: string[];
  ganttRows: GanttRowItem[];
}

export interface GanttRowItem {
  campsiteId: number;
  zoneId: number;
  siteDisplayName: string;
  groupName: string;
  zoneType: number;
  thumbnailUrl: string | null;
  dailyStatuses: SiteDailyStatus[];
}

export interface SiteDailyStatus {
  date: string;
  dailyPrice: number;
  status: string;
}

export interface CampZoneDetailDto {
  zoneId: number;
  zoneName: string;
  zoneDescription: string | null;
  zoneType: number;
  photoUrls: string[];
  facilities: FacilityItem[];
  capacityPeoplePerSite: number | null;
}

export interface FacilityItem {
  facilityId: number;
  facilityName: string;
  iconUrl: string | null;
}

export interface CampZoneCalendarDto {
  zoneId: number;
  zoneName: string;
  zoneType: number;
  maxCapacity: number | null;
  dailySummaries: ZoneDailySummary[] | null;
  units: UnitCard[] | null;
}

export interface ZoneDailySummary {
  date: string;
  dailyPrice: number;
  remainingSites: number;
  status: string;
}

export interface UnitCard {
  campsiteId: number;
  siteNumber: string;
  description: string | null;
  capacityPeople: number;
  photoUrls: string[];
  facilities: FacilityItem[];
  isAvailable: boolean;
  pricePerNight: number | null;
}

export interface ZoneOrderSummaryDto {
  zoneId: number;
  zoneName: string;
  zoneType: number;
  items: ZoneOrderItem[];
  subTotal: number;
}

export interface ZoneOrderItem {
  campsiteId: number;
  siteNumber: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  pricePerNight: number;
  itemSubTotal: number;
}

export interface CampSelectionRequestDto {
  campgroundId: number;
  selectedCampsites: CampsiteSelectionItem[];
}

export interface CampsiteSelectionItem {
  campsiteId: number;
  zoneId: number | null;
  checkInDate: string;
  checkOutDate: string;
}

export interface CampOrderSummaryDto {
  campgroundId: number;
  campgroundName: string;
  campsites: CampsiteBreakdownItem[];
  campSubTotal: number;
}

export interface CampsiteBreakdownItem {
  campsiteId: number;
  zoneName: string;
  siteNumber: string;
  zoneType: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  itemSubTotal: number;
}

// ===== Phase 5：結帳 =====

export interface CheckoutSummaryDto {
  campgroundId: number;
  campgroundName: string;
  campsites: CampsiteLineItem[];
  campSubTotal: number;
  equipments: EquipmentBreakdownItem[];
  equipmentSubTotal: number;
  appliedPromotionId: number | null;
  promotionName: string | null;
  discountAmount: number;
  grandTotal: number;
}

export interface CampsiteLineItem {
  campsiteId: number;
  zoneId: number | null;
  siteDisplayName: string;
  zoneName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  subTotal: number;
}

export interface EquipmentBreakdownItem {
  productVariantId: number;
  productName: string;
  variantName: string | null;
  quantity: number;
  pricePerUnit: number;
  itemSubTotal: number;
}

export interface CheckoutSubmitDto {
  campgroundId: number;
  selectedCampsites: CampsiteSelectionItem[];
  selectedEquipments: EquipmentSelectionItem[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  appliedPromotionId: number | null;
  shippingMethodId: number | null;
}

export interface EquipmentSelectionItem {
  productVariantId: number;
  quantity: number;
}

export interface CheckoutResultDto {
  success: boolean;
  orderId: number | null;
  orderNumber: string | null;
  paymentServiceUrl: string | null;
  paymentFormParams: Record<string, string> | null;
  lockExpiresAt: string | null;
  unavailableItems: string[] | null;
}

// ===== Phase 5b：裝備加購 =====

export interface EquipmentListItemDto {
  productId: number;
  name: string;
  category: string;
  mainImageUrl: string | null;
  isVariantProduct: boolean | null;
  variants: EquipmentVariantSummaryDto[];
}

export interface EquipmentVariantSummaryDto {
  variantId: number;
  variantName: string;
  sku: string;
  dailyRentalPrice: number;
  availableStock: number;
}

export interface EquipmentDetailDto {
  productId: number;
  name: string;
  category: string;
  description: string;
  mainImageUrl: string | null;
  isVariantProduct: boolean | null;
  variants: EquipmentVariantDetailDto[];
}

export interface EquipmentVariantDetailDto {
  variantId: number;
  variantName: string;
  sku: string;
  image: string | null;
  dailyRentalPrice: number;
  totalStock: number;
  availableStock: number;
}

export interface ShippingMethodDto {
  shippingMethodId: number;
  methodName: string;
  methodCode: string;
  baseFee: number;
  freeShippingThreshold: number | null;
  description: string | null;
}

export interface EquipmentBreakdownRequestDto {
  checkInDate: string;
  checkOutDate: string;
  selectedEquipments: EquipmentSelectionItem[];
}

export interface EquipmentBreakdownResultDto {
  success: boolean;
  items: EquipmentBreakdownItem[];
  equipmentSubTotal: number;
  unavailableItems: string[] | null;
}

// 加購頁確認後寫入 sessionStorage 的內容，欄位名稱對齊 CheckoutSubmitDto / CheckoutSummaryDto，
// 結帳頁可直接讀取後分別塞進自己的 DTO。
export interface StoredEquipmentSelection {
  selectedEquipments: EquipmentSelectionItem[]; // -> CheckoutSubmitDto.selectedEquipments
  shippingMethodId: number | null; // -> CheckoutSubmitDto.shippingMethodId
  equipments: EquipmentBreakdownItem[]; // -> CheckoutSummaryDto.equipments
  equipmentSubTotal: number; // -> CheckoutSummaryDto.equipmentSubTotal
}

// ===== Phase 6：付款/退款 =====

export interface PaymentStatusDto {
  orderNumber: string;
  status: 'Processing' | 'Success' | 'Failed';
  message: string | null;
}

export interface RefundRequestDto {
  orderId: number;
  orderDetailIds: number[];
}

export interface RefundResultDto {
  orderId: number;
  items: RefundItemResult[];
  totalRefundAmount: number;
  refundProcessed: boolean | null;
  message: string;
}

export interface RefundItemResult {
  orderDetailId: number;
  itemType: string;
  itemName: string;
  checkInDate: string;
  daysBeforeCheckIn: number;
  matchedTierName: string;
  isTyphoonOverride: boolean;
  typhoonDate: string | null;
  isRefundable: boolean;
  refundAmount: number;
}

// ===== Phase 7：營主錢包 =====

export interface OwnerWalletDto {
  balance: number;
  settlementHistory: SettlementRecordItem[];
  withdrawalPolicy: WithdrawalPolicyInfo;
}

export interface SettlementRecordItem {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  platformFee: number;
  netRevenue: number;
  settledDate: string;
}

export interface WithdrawalPolicyInfo {
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  monthlyFreeTimes: number;
  remainingFreeTimes: number;
  interbankFee: number;
  clearanceDays: number;
}

export interface WithdrawalRequestDto {
  amount: number;
  bankAccount: string;
}

export interface WithdrawalResultDto {
  success: boolean;
  withdrawalId: number | null;
  status: string | null;
  feeCharged: number;
  actualAmount: number;
  message: string;
}
