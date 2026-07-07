import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class Checkout implements OnInit, OnDestroy {
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

  // 宅配收件人（選擇黑貓宅配時才需填）
  receiverName = '';
  receiverPhone = '';
  receiverZipCode = '';
  receiverAddress = '';

  get isHomeDelivery(): boolean {
    return this.equipmentData?.shippingMethodCode === 'LALAMOVE' &&
      (this.summary?.equipmentSubTotal ?? 0) > 0;
  }

  submitting = false;
  submitError = '';
  unavailableItems: string[] = [];

  cancelling = false;
  // 「找不到選位資料」畫面按「檢查並釋放卡住的訂單」後的結果訊息
  pendingCheckMessage = '';

  // 使用者在綠界頁面按瀏覽器「上一頁」回到這頁時，有些瀏覽器（尤其 Chrome）不會重新整理，
  // 而是用 bfcache 把「離開前那一刻凍結的畫面」直接還原回來——包含當時 submitting=true 的狀態，
  // 畫面會卡在「處理中」，誤導使用者以為頁面壞了。用 pageshow 事件偵測這個情況，強制重置。
  private onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      this.submitting = false;
      this.submitError = '';
      this.loadData();
    }
  };

  constructor(
    private checkoutService: CheckoutService,
    private campSelectionService: CampSelectionService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadData();
    window.addEventListener('pageshow', this.onPageShow);
  }

  ngOnDestroy() {
    window.removeEventListener('pageshow', this.onPageShow);
  }

  private loadData() {
    const campgroundId = this.campSelectionService.campgroundId;
    const selectedCampsites = this.campSelectionService.toRequestItems();

    if (campgroundId === null || selectedCampsites.length === 0) {
      this.noSelection = true;
      this.loading = false;
      return;
    }

    this.noSelection = false;
    this.loading = true;
    this.loadEquipmentFromStorage();

    // 把裝備 + 運送方式一起送給後端，讓後端算出「已含裝備租金 + 運費」的 grandTotal，
    // 前端直接顯示這個值，保證畫面金額 == 實際刷卡金額（單一金額來源，不在前端另外加運費/裝備）。
    this.checkoutService.getSummary({
      campgroundId,
      selectedCampsites,
      selectedEquipments: this.equipmentData?.selectedEquipments ?? [],
      shippingMethodId: this.equipmentData?.shippingMethodId ?? null,
    }).subscribe({
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

  // 後端 /Checkout/summary 的 grandTotal 已含營位 − 折扣 + 裝備租金 + 運費（我們有把裝備一起送過去），
  // 前端直接用這個值，不再自己加，避免跟實際刷卡金額對不上。
  get grandTotal(): number {
    return this.summary?.grandTotal ?? 0;
  }

  // 手機：台灣手機格式 09 + 8 碼數字；Email：基本格式（有 @、網域、點）
  private readonly phonePattern = /^09\d{8}$/;
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 「已經填了東西、但格式不對」才顯示錯誤，避免一進畫面每個欄位都紅通通
  get phoneInvalid(): boolean {
    const v = this.contactPhone.trim();
    return v.length > 0 && !this.phonePattern.test(v);
  }
  get emailInvalid(): boolean {
    const v = this.contactEmail.trim();
    return v.length > 0 && !this.emailPattern.test(v);
  }

  get canSubmit(): boolean {
    return (
      !!this.summary &&
      !this.submitting &&
      this.contactName.trim().length > 0 &&
      this.phonePattern.test(this.contactPhone.trim()) &&
      this.emailPattern.test(this.contactEmail.trim())
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
      receiverName: this.isHomeDelivery ? this.receiverName.trim() : null,
      receiverPhone: this.isHomeDelivery ? this.receiverPhone.trim() : null,
      receiverZipCode: this.isHomeDelivery ? this.receiverZipCode.trim() : null,
      receiverAddress: this.isHomeDelivery ? this.receiverAddress.trim() : null,
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

        // 注意：這裡不能清空 CampSelectionService！跳轉去綠界之後付款可能失敗/被取消/
        // 使用者按上一頁離開，選位資料要留著，使用者回來才能重試或主動取消，
        // 不然會跟「結帳失敗能重試」的設計互相打架。真正確定付款結果（成功或失敗）
        // 是在 payment-result 頁面，要清空也是那邊清空，這裡只負責跳轉。
        const redirected = this.checkoutService.redirectToPayment(result);
        if (!redirected) {
          this.submitting = false;
          this.submitError = '訂單已建立，但導向付款頁面失敗，請稍後再試或聯絡客服。';
        }
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

  // 使用者放棄這次結帳：主動釋放後端鎖定的營位，不用乾等 15 分鐘背景排程。
  // 這個方法也被「找不到選位資料」畫面的「檢查並釋放卡住的訂單」按鈕共用——
  // 那個情境下選位資料本來就不見了（例如電腦當機重開），取消 API 只需要登入身分就能查，
  // 不需要選位資料，所以同一個方法可以共用，只是那邊要留在原地顯示結果訊息，不直接跳轉。
  cancelAndLeave() {
    this.cancelling = true;
    this.pendingCheckMessage = '';

    this.checkoutService.cancelPending().subscribe({
      next: res => {
        this.cancelling = false;
        this.campSelectionService.clear();
        sessionStorage.removeItem(EquipmentCartService.STORAGE_KEY);

        if (this.noSelection) {
          this.pendingCheckMessage = res.cancelled
            ? '已釋放一筆卡住的訂單，營位已重新開放。'
            : '沒有找到待付款的訂單，目前沒有東西需要釋放。';
          return;
        }

        this.router.navigate(['/']);
      },
      error: () => {
        this.cancelling = false;
        if (this.noSelection) {
          this.pendingCheckMessage = '檢查失敗，請稍後再試。';
        } else {
          this.submitError = '取消失敗，請稍後再試。';
        }
      },
    });
  }
}
