export interface NotificationItem {
  notificationId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  linkUrl?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
