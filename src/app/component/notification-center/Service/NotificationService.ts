import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { NotificationItem, UnreadCountResponse } from '../interface/NotificationItem';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'https://localhost:7011/api/Notification';
  private unreadCountSubject = new BehaviorSubject<number>(0);

  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<UnreadCountResponse>(`${this.apiUrl}/unread-count`)
      .pipe(
        map((response) => response.unreadCount ?? 0),
        tap((count) => this.unreadCountSubject.next(count)),
      );
  }

  refreshUnreadCount(): Observable<number> {
    return this.getUnreadCount();
  }

  clearUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(switchMap(() => this.refreshUnreadCount()));
  }

  createNotification(payload: {
    userId: number;
    recipientRole: string;
    title: string;
    message: string;
    type?: string;
    linkUrl?: string;
  }): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  markAllAsRead(): Observable<any> {
    return this.getNotifications().pipe(
      switchMap((items) => {
        const unreadItems = items.filter((item) => !item.isRead);

        if (unreadItems.length === 0) {
          this.unreadCountSubject.next(0);
          return of([]);
        }

        return forkJoin(unreadItems.map((item) => this.http.put(`${this.apiUrl}/${item.notificationId}/read`, {}))).pipe(
          tap(() => this.unreadCountSubject.next(0)),
        );
      }),
    );
  }
}
