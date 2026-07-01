import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationItem } from './interface/NotificationItem';
import { NotificationService } from './Service/NotificationService';

@Component({
  selector: 'app-notification-center',
  imports: [DatePipe, NgClass],
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.css',
})
export class NotificationCenter implements OnInit {
  notifications: NotificationItem[] = [];
  activeFilter: 'all' | 'unread' | 'read' = 'all';
  loading = true;
  errorMessage = '';
  markingAll = false;
  deletingNotificationId: number | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  get unreadCount(): number {
    return this.notifications.filter((item) => !item.isRead).length;
  }

  get filteredNotifications(): NotificationItem[] {
    if (this.activeFilter === 'unread') {
      return this.notifications.filter((item) => !item.isRead);
    }

    if (this.activeFilter === 'read') {
      return this.notifications.filter((item) => item.isRead);
    }

    return this.notifications;
  }

  loadNotifications() {
    this.loading = true;
    this.errorMessage = '';

    this.notificationService.getNotifications().subscribe({
      next: (items) => {
        this.notifications = items;
        this.notificationService.refreshUnreadCount().subscribe();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = '通知讀取失敗，請稍後再試。';
        this.loading = false;
      },
    });
  }

  setFilter(filter: 'all' | 'unread' | 'read') {
    this.activeFilter = filter;
  }

  markAsRead(item: NotificationItem, event?: Event) {
    event?.stopPropagation();

    if (item.isRead) {
      this.openNotification(item);
      return;
    }

    this.notificationService.markAsRead(item.notificationId).subscribe({
      next: () => {
        item.isRead = true;
      },
      error: () => {
        this.errorMessage = '通知狀態更新失敗。';
      },
    });
  }

  markAllAsRead() {
    if (this.unreadCount === 0 || this.markingAll) return;

    this.markingAll = true;
    this.errorMessage = '';

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((item) => ({ ...item, isRead: true }));
        this.markingAll = false;
      },
      error: () => {
        this.errorMessage = '全部標示已讀失敗。';
        this.markingAll = false;
      },
    });
  }

  deleteNotification(item: NotificationItem, event: Event) {
    event.stopPropagation();

    if (this.deletingNotificationId !== null) return;

    this.deletingNotificationId = item.notificationId;
    this.errorMessage = '';

    this.notificationService.deleteNotification(item.notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(
          (notification) => notification.notificationId !== item.notificationId,
        );
        this.deletingNotificationId = null;
      },
      error: () => {
        this.errorMessage = '通知刪除失敗，請稍後再試。';
        this.deletingNotificationId = null;
      },
    });
  }
  openNotification(item: NotificationItem) {
    if (!item.isRead) {
      this.markAsRead(item);
    }

    if (item.linkUrl) {
      this.router.navigateByUrl(item.linkUrl);
    }
  }

  getTypeLabel(type?: string): string {
    switch ((type ?? '').toLowerCase()) {
      case 'order':
        return '訂單';
      case 'payment':
        return '付款';
      case 'system':
        return '系統';
      case 'camp':
        return '營地';
      default:
        return '通知';
    }
  }

  getTypeIcon(type?: string): string {
    switch ((type ?? '').toLowerCase()) {
      case 'order':
        return 'pi pi-receipt';
      case 'payment':
        return 'pi pi-credit-card';
      case 'system':
        return 'pi pi-cog';
      case 'camp':
        return 'pi pi-map-marker';
      default:
        return 'pi pi-bell';
    }
  }
}
