import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EquipmentRentalService } from '../../services/equipment-rental.service';
import { EquipmentCartService } from '../../services/equipment-cart.service';
import {
  EquipmentListItemDto,
  ShippingMethodDto,
  StoredEquipmentSelection,
} from '../../interfaces/camp.interface';

@Component({
  selector: 'app-camping-rental',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './camping-rental.html',
  styleUrls: ['./camping-rental.css'],
})
export class CampingRentalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private equipmentRentalService = inject(EquipmentRentalService);
  cart = inject(EquipmentCartService);

  campgroundId = signal<number>(0);
  checkInDate = signal<string>('');
  checkOutDate = signal<string>('');

  equipmentList = signal<EquipmentListItemDto[]>([]);
  shippingMethods = signal<ShippingMethodDto[]>([]);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  submitting = signal(false);

  nights = computed(() => {
    if (!this.checkInDate() || !this.checkOutDate()) return 1;
    const inDate = new Date(this.checkInDate());
    const outDate = new Date(this.checkOutDate());
    const diff = Math.round((outDate.getTime() - inDate.getTime()) / 86400000);
    return diff > 0 ? diff : 1;
  });

  ngOnInit(): void {
    this.campgroundId.set(Number(this.route.snapshot.paramMap.get('id')) || 0);
    const qp = this.route.snapshot.queryParamMap;
    this.checkInDate.set(qp.get('checkIn') ?? '');
    this.checkOutDate.set(qp.get('checkOut') ?? '');

    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.equipmentRentalService.getEquipmentList().subscribe({
      next: (list) => {
        this.equipmentList.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('裝備清單載入失敗，請稍後再試。');
        this.loading.set(false);
      },
    });

    this.equipmentRentalService.getShippingMethods().subscribe({
      next: (methods) => {
        this.shippingMethods.set(methods);
        if (methods.length > 0 && this.cart.shippingMethodId() === null) {
          this.cart.shippingMethodId.set(methods[0].shippingMethodId);
        }
      },
    });
  }

  getQuantity(variantId: number): number {
    return this.cart.getQuantity(variantId);
  }

  changeQuantity(variantId: number, delta: number, maxStock: number): void {
    const next = this.getQuantity(variantId) + delta;
    this.cart.setQuantity(variantId, Math.min(Math.max(next, 0), maxStock));
  }

  selectShippingMethod(id: number): void {
    this.cart.shippingMethodId.set(id);
  }

  lineSubTotal(dailyPrice: number, variantId: number): number {
    return dailyPrice * this.nights() * this.getQuantity(variantId);
  }

  cartTotal(): number {
    let total = 0;
    for (const product of this.equipmentList()) {
      for (const v of product.variants) {
        total += this.lineSubTotal(v.dailyRentalPrice, v.variantId);
      }
    }
    return total;
  }

  // 商品卡片用：該商品款式中最低的每日租金，當作「最低 $xx/天」標示
  productMinPrice(product: EquipmentListItemDto): number {
    if (product.variants.length === 0) return 0;
    return Math.min(...product.variants.map((v) => v.dailyRentalPrice));
  }

  // 商品卡片用：該商品總可選庫存（所有款式加總）
  productTotalStock(product: EquipmentListItemDto): number {
    return product.variants.reduce((sum, v) => sum + v.availableStock, 0);
  }

  // 商品卡片用：使用者目前已選了這個商品底下多少數量（跨款式加總），顯示已選徽章
  productSelectedQuantity(product: EquipmentListItemDto): number {
    return product.variants.reduce((sum, v) => sum + this.getQuantity(v.variantId), 0);
  }

  // 沒有商品照片時，依分類顯示對應的 Emoji 圖示卡，避免用隨機圖庫圖片混充內容
  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      帳篷: '🏕️',
      寢具: '🛏️',
      炊具: '🔥',
    };
    return icons[category] ?? '🎒';
  }

  // 使用者不需要裝備，直接進結帳
  skip(): void {
    sessionStorage.removeItem(EquipmentCartService.STORAGE_KEY);
    this.cart.clear();
    this.router.navigate(['/checkout']);
  }

  // 確認加購：呼叫後端驗證庫存與算金額，通過才寫入交給結帳頁
  confirm(): void {
    if (this.cart.isEmpty()) {
      this.skip();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.equipmentRentalService
      .calculateBreakdown({
        checkInDate: this.checkInDate(),
        checkOutDate: this.checkOutDate(),
        selectedEquipments: this.cart.toSelectionItems(),
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          if (!result.success) {
            this.errorMessage.set((result.unavailableItems ?? []).join('、'));
            return;
          }

          // 欄位名稱對齊同學的 CheckoutSubmitDto / CheckoutSummaryDto，
          // 結帳頁可以直接把這幾個欄位塞進自己的 DTO，不用再轉換。
          const selectedMethod = this.shippingMethods().find(
            m => m.shippingMethodId === this.cart.shippingMethodId()
          );
          const stored: StoredEquipmentSelection = {
            selectedEquipments: this.cart.toSelectionItems(),
            shippingMethodId: this.cart.shippingMethodId(),
            shippingMethodCode: selectedMethod?.methodCode ?? null,
            equipments: result.items,
            equipmentSubTotal: result.equipmentSubTotal,
          };
          sessionStorage.setItem(EquipmentCartService.STORAGE_KEY, JSON.stringify(stored));
          this.router.navigate(['/checkout']);
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('加購裝備確認失敗，請稍後再試。');
        },
      });
  }
}
