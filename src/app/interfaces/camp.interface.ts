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

// ===== Phase 2：搜尋 =====

export interface CampSearchRequest {
  keyword?: string;
  area?: string;
  checkIn?: string;
  checkOut?: string;
  requirements?: RequirementItem[];
  tagIds?: number[];
  facilityIds?: number[];
  sortBy?: 'Recommended' | 'PriceAsc' | 'PriceDesc' | 'RatingDesc' | 'ElevationAsc' | 'ElevationDesc';
  page?: number;
  pageSize?: number;
}

export interface RequirementItem {
  itemId: number;
  quantity: number;
}

export interface CampSearchResponseDto {
  total: number;
  page: number;
  pageSize: number;
  items: CampSearchResultDto[];
}

export interface CampMapResponseDto {
  isClustered: boolean;
  markers: CampMapMarker[];
}

export interface CampMapMarker {
  campgroundId: number;
  name: string;
  lat: number;
  lng: number;
  avgRating: number | null;
  lowestPrice: number | null;
}

export interface CampFilterDto {
  environmentTags: TagItem[];
  policyTags: TagItem[];
  facilities: FacilityItem[];
}

export interface TagItem {
  tagId: number;
  tagName: string;
  iconUrl: string | null;
}

export interface FacilityItem {
  facilityId: number;
  facilityName: string;
  iconUrl: string | null;
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
  tags: CampDetailTagItem[];
}

export interface CampDetailTagItem {
  tagName: string;
  category: string;
  iconUrl: string;
}

export interface CampLocationDto {
  campgroundId: number;
  fullAddress: string;
  lat: number;
  lng: number;
}

export interface CampMapZoneDto {
  zoneId: number;
  zoneName: string;
  zoneType: number;
  geoJson: string | null;
  totalSites: number;
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
  status: 'A' | 'U';
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
  status: 'A' | 'U';
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
  name: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
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
  success: true;
  orderId: number;
  orderNumber: string;
  paymentServiceUrl: string;
  paymentFormParams: Record<string, string>;
  lockExpiresAt: string;
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
  itemType: 'Campsite' | 'Equipment';
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
  withdrawalId?: number;
  status?: string;
  feeCharged?: number;
  actualAmount?: number;
  message: string;
}
