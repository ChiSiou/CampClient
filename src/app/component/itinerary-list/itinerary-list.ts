import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MemberService } from '../member/Service/member-service';
import { OrderDetail, OrderList } from '../member/interface/orderList';

interface ItineraryItem {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: number;
  campId: number;
  campName: string;
  campImageUrl: string;
  checkinDate: string;
  checkoutDate: string;
  nights: number;
  accomTypes: string[];
  details: OrderDetail[];
  tripStatus: 'upcoming' | 'current' | 'past';
}

@Component({
  selector: 'app-itinerary-list',
  imports: [DatePipe, NgClass, RouterLink, CommonModule],
  templateUrl: './itinerary-list.html',
  styleUrl: './itinerary-list.css',
})
export class ItineraryList implements OnInit {
  itineraries: ItineraryItem[] = [];
  loading = true;
  errorMessage = '';

  constructor(private memberService: MemberService) {}

  ngOnInit() {
    this.loadItineraries();
  }

  get totalUpcomingPaidCount(): number {
    return this.itineraries.length;
  }

  private loadItineraries() {
    this.loading = true;
    this.errorMessage = '';

    this.memberService.getorder().subscribe({
      next: (orders) => {
        this.itineraries = orders
          .filter((order) => this.isPaidOrder(order))
          .flatMap((order) => this.toItineraryItems(order))
          .filter((item) => item.tripStatus === 'upcoming')
          .sort((a, b) => this.toDateTime(a.checkinDate) - this.toDateTime(b.checkinDate));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = '行程清單載入失敗，請稍後再試。';
        this.loading = false;
      },
    });
  }

  private isPaidOrder(order: OrderList): boolean {
    return order.status === 1 && order.details.length > 0;
  }

  private toItineraryItems(order: OrderList): ItineraryItem[] {
    const detailsByCamp = new Map<number, OrderDetail[]>();

    for (const detail of order.details) {
      const details = detailsByCamp.get(detail.campId) ?? [];
      details.push(detail);
      detailsByCamp.set(detail.campId, details);
    }

    return Array.from(detailsByCamp.values()).map((details) => {
      const first = details[0];
      const checkinDate = details
        .map((detail) => detail.checkinDate)
        .sort((a, b) => this.toDateTime(a) - this.toDateTime(b))[0];
      const checkoutDate = details
        .map((detail) => detail.checkoutDate)
        .sort((a, b) => this.toDateTime(b) - this.toDateTime(a))[0];
      const accomTypes = Array.from(
        new Set(details.map((detail) => detail.accomType).filter(Boolean)),
      );

      return {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        totalAmount: details.reduce((sum, detail) => sum + (detail.totalAmount ?? 0), 0),
        status: order.status,
        campId: first.campId,
        campName: first.campName,
        campImageUrl: first.campImageUrl,
        checkinDate,
        checkoutDate,
        nights: this.getNightCount(checkinDate, checkoutDate),
        accomTypes,
        details,
        tripStatus: this.getTripStatus(checkinDate, checkoutDate),
      };
    });
  }

  private getTripStatus(
    checkinDate: string,
    checkoutDate: string,
  ): 'upcoming' | 'current' | 'past' {
    const today = this.startOfToday().getTime();
    const checkin = this.startOfDate(checkinDate).getTime();
    const checkout = this.startOfDate(checkoutDate).getTime();

    if (today < checkin) {
      return 'upcoming';
    }

    if (today >= checkout) {
      return 'past';
    }

    return 'current';
  }

  private getNightCount(checkinDate: string, checkoutDate: string): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = this.startOfDate(checkoutDate).getTime() - this.startOfDate(checkinDate).getTime();

    return Math.max(1, Math.round(diff / oneDay));
  }

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private startOfDate(value: string): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private toDateTime(value: string): number {
    return this.startOfDate(value).getTime();
  }

  getTripStatusText(status: ItineraryItem['tripStatus']): string {
    switch (status) {
      case 'upcoming':
        return '即將出發';
      case 'current':
        return '旅程中';
      case 'past':
        return '已完成';
    }
  }

  getTripStatusClass(status: ItineraryItem['tripStatus']): string {
    return status;
  }
}
