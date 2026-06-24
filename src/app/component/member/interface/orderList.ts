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
  campId: number;
  campName: string;
  totalAmount: number;
  checkinDate: string;
  checkoutDate: string;
  campImageUrl: string;
}
