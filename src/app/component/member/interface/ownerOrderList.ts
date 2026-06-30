export interface OwnerOrderList {
  orderId: number;
  orderNumber: string;
  campName: string;
  checkInDate: string | null;
  totalAmount: number;
  status: number;
  customerId: number;
  customerName: string;
}
