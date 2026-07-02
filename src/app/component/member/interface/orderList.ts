export interface OrderList {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  status: number;
  orderNumber: string;
  details: OrderDetail[];
}

export interface OrderDetail {
  orderDetailId: number;
  itemType: 'camp' | 'equipment';
  campId?: number | null;
  spotId?: number | null;
  equipmentId?: number | null;
  variantId?: number | null;
  campName: string;
  totalAmount: number;
  checkinDate: string;
  checkoutDate: string;
  accomType: string;
  campImageUrl: string;
  ownerId?: number;
  ownerName?: string;
}
