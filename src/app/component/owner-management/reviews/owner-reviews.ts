import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OwnerReviewService } from '../../../services/owner-review.service';
import {
  OwnerCampgroundOption,
  OwnerReviewListItem,
  REPORT_REASON_OPTIONS,
} from '../../../interfaces/owner-review.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-owner-reviews',
  imports: [
    FormsModule,
    DatePipe,
    RatingModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DialogModule,
    PaginatorModule,
    TextareaModule,
    ToastModule,
  ],
  templateUrl: './owner-reviews.html',
  styleUrl: './owner-reviews.css',
  providers: [MessageService],
})
export class OwnerReviews implements OnInit {
  campOptions: { label: string; value: number | null }[] = [{ label: '全部營地', value: null }];
  selectedCampId: number | null = null;

  reviews: OwnerReviewListItem[] = [];
  totalCount = 0;
  first = 0;
  rows = 10;
  loading = false;

  replyDialogVisible = false;
  replyTarget: OwnerReviewListItem | null = null;
  replyContent = '';
  replySubmitting = false;

  reportDialogVisible = false;
  reportTarget: OwnerReviewListItem | null = null;
  reportReasonOptions = REPORT_REASON_OPTIONS;
  reportReasonType: number = REPORT_REASON_OPTIONS[0].value;
  reportReasonDetail = '';
  reportSubmitting = false;

  constructor(
    private ownerReviewService: OwnerReviewService,
    private messageService: MessageService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.ownerReviewService.getCampgrounds().subscribe({
      next: (data: OwnerCampgroundOption[]) => {
        this.campOptions = [
          { label: '全部營地', value: null },
          ...data.map((c) => ({ label: c.name, value: c.campId })),
        ];
      },
      error: (err) => console.error('載入營地清單失敗', err),
    });
    this.loadReviews();
  }

  loadReviews() {
    this.loading = true;
    const page = Math.floor(this.first / this.rows) + 1;
    this.ownerReviewService.getReviews(this.selectedCampId, page, this.rows).subscribe({
      next: (result) => {
        this.reviews = result.items;
        this.totalCount = result.totalCount;
        this.loading = false;
      },
      error: (err) => {
        console.error('載入評論失敗', err);
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: '載入失敗', detail: '無法載入評論資料。', life: 3000 });
      },
    });
  }

  onCampChange() {
    this.first = 0;
    this.loadReviews();
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.loadReviews();
  }

  gotoCampReview(cid: number | null) {
    this.router.navigate([`camp/${cid}`]);
  }

  openReplyDialog(review: OwnerReviewListItem) {
    this.replyTarget = review;
    this.replyContent = review.ownerReplyContent ?? '';
    this.replyDialogVisible = true;
  }

  submitReply() {
    if (!this.replyTarget || !this.replyContent.trim()) return;
    this.replySubmitting = true;
    this.ownerReviewService.reply(this.replyTarget.reviewId, this.replyContent.trim()).subscribe({
      next: () => {
        this.replySubmitting = false;
        this.replyDialogVisible = false;
        this.messageService.add({ severity: 'success', summary: '回覆成功', detail: '已送出你的回覆。', life: 3000 });
        this.loadReviews();
      },
      error: (err) => {
        this.replySubmitting = false;
        console.error('回覆失敗', err);
        this.messageService.add({ severity: 'error', summary: '回覆失敗', detail: err.error?.message ?? '請稍後再試。', life: 3000 });
      },
    });
  }

  openReportDialog(review: OwnerReviewListItem) {
    this.reportTarget = review;
    this.reportReasonType = REPORT_REASON_OPTIONS[0].value;
    this.reportReasonDetail = '';
    this.reportDialogVisible = true;
  }

  submitReport() {
    if (!this.reportTarget) return;
    this.reportSubmitting = true;
    this.ownerReviewService
      .report(this.reportTarget.reviewId, {
        reasonType: this.reportReasonType,
        reasonDetail: this.reportReasonDetail.trim(),
      })
      .subscribe({
        next: () => {
          this.reportSubmitting = false;
          this.reportDialogVisible = false;
          this.messageService.add({ severity: 'success', summary: '檢舉已送出', detail: '平台將盡快審核。', life: 3000 });
          this.loadReviews();
        },
        error: (err) => {
          this.reportSubmitting = false;
          console.error('檢舉失敗', err);
          this.messageService.add({ severity: 'error', summary: '檢舉失敗', detail: err.error?.message ?? '請稍後再試。', life: 3000 });
        },
      });
  }
}
