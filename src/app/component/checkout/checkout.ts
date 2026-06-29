import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';
import { CampSelectionService } from '../../services/camp-selection.service';
import { EquipmentCartService } from '../../services/equipment-cart.service';
import {
  CheckoutSummaryDto,
  CheckoutSubmitDto,
  StoredEquipmentSelection,
} from '../../interfaces/camp.interface';

@Component({
  selector: 'app-checkout',
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  loading = true;
  // 完全沒有選位資料時顯示的狀態（例如直接打開網址、或重新整理後選位被清空）
  noSelection = false;
  errorMessage = '';

  summary: CheckoutSummaryDto | null = null;
  // 裝備加購由同仁的頁面寫進 sessionStorage，這裡讀出來就好，不用再打 API
  equipmentData: StoredEquipmentSelection | null = null;

  // 聯絡人資料表單
  contactName = '';
  contactPhone = '';
  contactEmail = '';

  submitting = false;
  submitError = '';
  unavailableItems: string[] = [];

  constructor(
    private checkoutService: CheckoutService,
    private campSelectionService: CampSelectionService,
    private router: Router,
  ) {}

  ngOnInit() {
    const campgroundId = this.campSelectionService.campgroundId;
    const selectedCampsites = this.campSelectionService.toRequestItems();

    if (campgroundId === null || selectedCampsites.length === 0) {
      this.noSelection = true;
      this.loading = false;
      return;
    }

    this.loadEquipmentFromStorage();

    this.checkoutService.getSummary({ campgroundId, selectedCampsites }).subscribe({
      next: res => {
        this.summary = res;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = '無法取得訂單摘要，請稍後再試。';
        this.loading = false;
      },
    });
  }

  // 同仁的裝備頁確認後會把結果寫進 sessionStorage，這裡讀出來合併顯示。
  // 沒有這個 key 代表使用者選擇「不需要裝備」或從未進過裝備頁，視為空裝備清單。
  private loadEquipmentFromStorage() {
    const raw = sessionStorage.getItem(EquipmentCartService.STORAGE_KEY);
    if (!raw) return;

    try {
      this.equipmentData = JSON.parse(raw) as StoredEquipmentSelection;
    } catch {
      this.equipmentData = null;
    }
  }

  // 後端 /Checkout/summary 的 grandTotal 只算營位金額（折扣也只看營位金額），
  // 裝備金額是前端從 sessionStorage 讀到後自己加上去的
  get grandTotal(): number {
    const campTotal = this.summary?.grandTotal ?? 0;
    const equipmentTotal = this.equipmentData?.equipmentSubTotal ?? 0;
    return campTotal + equipmentTotal;
  }

  get canSubmit(): boolean {
    return (
      !!this.summary &&
      !this.submitting &&
      this.contactName.trim().length > 0 &&
      this.contactPhone.trim().length > 0 &&
      this.contactEmail.trim().length > 0
    );
  }

  submit() {
    if (!this.canSubmit || !this.summary) return;

    const campgroundId = this.campSelectionService.campgroundId;
    if (campgroundId === null) return;

    const dto: CheckoutSubmitDto = {
      campgroundId,
      selectedCampsites: this.campSelectionService.toRequestItems(),
      selectedEquipments: this.equipmentData?.selectedEquipments ?? [],
      contactName: this.contactName.trim(),
      contactPhone: this.contactPhone.trim(),
      contactEmail: this.contactEmail.trim(),
      appliedPromotionId: this.summary.appliedPromotionId,
      shippingMethodId: this.equipmentData?.shippingMethodId ?? null,
    };

    this.submitting = true;
    this.submitError = '';
    this.unavailableItems = [];

    this.checkoutService.submit(dto).subscribe({
      next: result => {
        if (!result.success) {
          this.submitting = false;
          this.unavailableItems = result.unavailableItems ?? [];
          this.submitError = '部分營位已無法訂購，請返回重新選擇。';
          return;
        }

        // 先確認真的能跳轉到綠界才清空選位/購物車——不然像綠界設定值缺漏這種情況，
        // 會先清空選位卻沒辦法跳轉付款，使用者連重新送出的資料都沒了
        const redirected = this.checkoutService.redirectToPayment(result);
        if (!redirected) {
          this.submitting = false;
          this.submitError = '訂單已建立，但導向付款頁面失敗，請稍後再試或聯絡客服。';
          return;
        }

        this.campSelectionService.clear();
        sessionStorage.removeItem(EquipmentCartService.STORAGE_KEY);
      },
      // 後端對「部分營位無法訂購」「已有待付款訂單」這類業務邏輯失敗回的是 409，
      // HttpClient 會把非 2xx 都當錯誤丟進這裡，真正的訊息要從 err.error 裡讀出來，
      // 不能只顯示寫死的通用文字，不然使用者完全不知道真正原因
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.unavailableItems = err.error?.unavailableItems ?? [];
        this.submitError = err.error?.message || '送出訂單失敗，請稍後再試。';
      },
    });
  }
}
