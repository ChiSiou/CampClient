import { Injectable, signal } from '@angular/core';
import { EquipmentSelectionItem } from '../interfaces/camp.interface';

// 裝備加購頁(camping-rental) 與裝備詳情頁共用的暫存購物清單，
// 讓使用者可以從清單頁或詳情頁加數量，離開頁面後選擇不會消失（直到送出/離開加購流程）。
// 最終送出時整包寫進 sessionStorage，交給結帳頁(checkout)讀取。
@Injectable({ providedIn: 'root' })
export class EquipmentCartService {
  private quantities = signal<Map<number, number>>(new Map());
  private prices = new Map<number, number>(); // variantId -> dailyRentalPrice
  shippingMethodId = signal<number | null>(null);

  getQuantity(variantId: number): number {
    return this.quantities().get(variantId) ?? 0;
  }

  setQuantity(variantId: number, quantity: number, dailyPrice?: number): void {
    const next = new Map(this.quantities());
    if (quantity <= 0) {
      next.delete(variantId);
      this.prices.delete(variantId);
    } else {
      next.set(variantId, quantity);
      if (dailyPrice !== undefined) this.prices.set(variantId, dailyPrice);
    }
    this.quantities.set(next);
  }

  totalAmount(nights: number): number {
    let total = 0;
    this.quantities().forEach((qty, variantId) => {
      total += (this.prices.get(variantId) ?? 0) * qty * nights;
    });
    return total;
  }

  toSelectionItems(): EquipmentSelectionItem[] {
    return Array.from(this.quantities().entries()).map(([variantId, quantity]) => ({
      productVariantId: variantId,
      quantity,
    }));
  }

  totalQuantity(): number {
    let total = 0;
    this.quantities().forEach(q => total += q);
    return total;
  }

  isEmpty(): boolean {
    return this.quantities().size === 0;
  }

  clear(): void {
    this.quantities.set(new Map());
    this.prices.clear();
    this.shippingMethodId.set(null);
  }

  // 結帳頁透過 sessionStorage 讀取這個 key 取得使用者的裝備加購結果
  static readonly STORAGE_KEY = 'equipmentSelection';
}
