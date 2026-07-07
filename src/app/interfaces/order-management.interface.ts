// ===== OrderManagement：業主訂單管理 =====
// Order.Status:       0=待付款 1=已付款 2=已取消 3=申訴中
// OrderDetail.Status: 1=已付款 2=已退款 3=退款審核中

export interface OrderListItemDto {
  orderId: number;
  orderNumber: string;
  status: number;
  contactName: string;
  contactPhone: string;
  createdTime: string;
  paidTime?: string;
  totalAmount: number;
  campgroundName: string;
  earliestCheckIn?: string;
  latestCheckOut?: string;
  siteSummary: string;
}

export interface OrderListResultDto {
  items: OrderListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OrderDetailItemDto {
  orderDetailId: number;
  itemType: string; // "Campsite" | "Equipment"
  siteNumber?: string;
  zoneName?: string;
  equipmentName?: string;
  price: number;
  status: number;
  quantity: number;
  checkInDate?: string;
  checkOutDate?: string;
  discountAmount?: number;
  actualRefund?: number;
}

export interface PaymentLogItemDto {
  logId: number;
  transactionId: string;
  amount: number;
  actionType: string;
  status: number;
  refundReason?: string;
}

export interface OrderOwnerDetailDto {
  orderId: number;
  orderNumber: string;
  status: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdTime: string;
  paidTime?: string;
  promotionDiscountAmount?: number;
  details: OrderDetailItemDto[];
  paymentLogs: PaymentLogItemDto[];
}

export interface OrderCancelRequestDto {
  orderDetailIds: number[];
}

export interface RefundItemResult {
  orderDetailId: number;
  itemType: string;
  itemName: string;
  checkInDate: string;
  daysBeforeCheckIn: number;
  matchedTierName: string;
  isTyphoonOverride: boolean;
  typhoonDate?: string;
  isRefundable: boolean;
  refundAmount: number;
}

export interface RefundResultDto {
  orderId: number;
  items: RefundItemResult[];
  totalRefundAmount: number;
  refundProcessed?: boolean;
  message: string;
}
