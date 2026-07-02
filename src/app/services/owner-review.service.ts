import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  OwnerCampgroundOption,
  OwnerReviewListResult,
  ReplyRequest,
  ReportReviewRequest,
} from '../interfaces/owner-review.interface';

@Injectable({ providedIn: 'root' })
export class OwnerReviewService {
  private base = `${environment.apiUrl}/OwnerReview`;

  constructor(private http: HttpClient) {}

  getCampgrounds() {
    return this.http.get<OwnerCampgroundOption[]>(`${this.base}/campgrounds`);
  }

  getReviews(campId: number | null, page: number, pageSize: number) {
    let url = `${this.base}?page=${page}&pageSize=${pageSize}`;
    if (campId != null) url += `&campId=${campId}`;
    return this.http.get<OwnerReviewListResult>(url);
  }

  reply(reviewId: number, content: string) {
    const dto: ReplyRequest = { content };
    return this.http.post<{ message: string }>(`${this.base}/${reviewId}/reply`, dto);
  }

  deleteReply(reviewId: number) {
    return this.http.delete<{ message: string }>(`${this.base}/${reviewId}/reply`);
  }

  report(reviewId: number, dto: ReportReviewRequest) {
    return this.http.post<{ message: string }>(`${this.base}/${reviewId}/report`, dto);
  }
}
