import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipmentRentalService } from '../../../services/equipment-rental.service';
import { EquipmentCartService } from '../../../services/equipment-cart.service';
import { EquipmentDetailDto } from '../../../interfaces/camp.interface';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './equipment-detail.html',
  styleUrls: ['./equipment-detail.css'],
})
export class EquipmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private equipmentRentalService = inject(EquipmentRentalService);
  cart = inject(EquipmentCartService);

  detail = signal<EquipmentDetailDto | null>(null);
  loading = signal(true);
  notFound = signal(false);

  lightboxUrl = signal<string | null>(null);

  // Lightbox 狀態
  imgX = 0;
  imgY = 0;
  imgScale = 1;
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private readonly MIN_SCALE = 0.3;
  private readonly MAX_SCALE = 5;

  openLightbox(url: string | null | undefined): void {
    if (!url) return;
    this.lightboxUrl.set(url);
    this.imgX = 0;
    this.imgY = 0;
    this.imgScale = 1;
  }

  closeLightbox(): void {
    this.lightboxUrl.set(null);
  }

  onDragStart(e: MouseEvent): void {
    this.dragging = true;
    this.startX = e.clientX - this.imgX;
    this.startY = e.clientY - this.imgY;
    e.preventDefault();
  }

  onDragMove(e: MouseEvent): void {
    if (!this.dragging) return;
    this.imgX = e.clientX - this.startX;
    this.imgY = e.clientY - this.startY;
  }

  onDragEnd(): void {
    this.dragging = false;
  }

  onOverlayClick(e: MouseEvent): void {
    if (!this.dragging) this.closeLightbox();
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.imgScale = Math.min(Math.max(this.imgScale * delta, this.MIN_SCALE), this.MAX_SCALE);
  }

  zoomIn(): void {
    this.imgScale = Math.min(this.imgScale * 1.25, this.MAX_SCALE);
  }

  zoomOut(): void {
    this.imgScale = Math.max(this.imgScale * 0.8, this.MIN_SCALE);
  }

  resetZoom(): void {
    this.imgX = 0;
    this.imgY = 0;
    this.imgScale = 1;
  }
  private campgroundId = 0;
  private checkInDate = '';
  private checkOutDate = '';

  nights = computed(() => {
    if (!this.checkInDate || !this.checkOutDate) return 1;
    const diff = Math.round(
      (new Date(this.checkOutDate).getTime() - new Date(this.checkInDate).getTime()) / 86400000,
    );
    return diff > 0 ? diff : 1;
  });

  ngOnInit(): void {
    this.campgroundId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    const qp = this.route.snapshot.queryParamMap;
    this.checkInDate = qp.get('checkIn') ?? '';
    this.checkOutDate = qp.get('checkOut') ?? '';
    const productId = Number(this.route.snapshot.paramMap.get('productId'));
    this.equipmentRentalService.getEquipmentDetail(productId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  getQuantity(variantId: number): number {
    return this.cart.getQuantity(variantId);
  }

  changeQuantity(variantId: number, delta: number, maxStock: number, event?: MouseEvent, imgUrl?: string | null): void {
    const next = this.getQuantity(variantId) + delta;
    this.cart.setQuantity(variantId, Math.min(Math.max(next, 0), maxStock));
    if (delta > 0 && event && imgUrl) this.flyToCart(event, imgUrl);
  }

  private flyToCart(event: MouseEvent, imgUrl: string): void {
    // 從款式圖片起飛
    const card = (event.target as HTMLElement).closest('.variant-card');
    const imgEl = card?.querySelector('.variant-image img') as HTMLElement | null;
    const source = (imgEl ?? event.target as HTMLElement).getBoundingClientRect();

    // 目標：summary bar 的購物車 icon
    const cartIcon = document.getElementById('cart-icon-target');
    const cartRect = cartIcon?.getBoundingClientRect();
    const targetX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth / 2;
    const targetY = cartRect ? cartRect.top + cartRect.height / 2 : window.innerHeight - 40;

    const clone = document.createElement('img') as HTMLImageElement;
    clone.src = imgUrl;
    Object.assign(clone.style, {
      position:     'fixed',
      left:         `${source.left + source.width / 2 - 30}px`,
      top:          `${source.top + source.height / 2 - 30}px`,
      width:        '60px',
      height:       '60px',
      objectFit:    'cover',
      borderRadius: '10px',
      zIndex:       '99999',
      pointerEvents:'none',
      opacity:      '1',
      transition:   'none',
      boxShadow:    '0 4px 16px rgba(0,0,0,0.35)',
    });
    document.body.appendChild(clone);

    // 下一幀才加 transition，確保起始位置已渲染
    requestAnimationFrame(() => requestAnimationFrame(() => {
      Object.assign(clone.style, {
        transition: 'left 0.65s cubic-bezier(0.4,0,0.2,1), top 0.65s cubic-bezier(0.4,0,0.2,1), width 0.65s ease, height 0.65s ease, opacity 0.65s ease, border-radius 0.65s ease',
        left:         `${targetX - 12}px`,
        top:          `${targetY - 12}px`,
        width:        '24px',
        height:       '24px',
        borderRadius: '50%',
        opacity:      '0',
      });
    }));

    setTimeout(() => {
      clone.remove();
      // 購物車 icon 彈跳
      const icon = document.getElementById('cart-icon-target');
      if (icon) {
        icon.classList.remove('bounce');
        void icon.offsetWidth; // reflow 重置動畫
        icon.classList.add('bounce');
      }
    }, 650);
  }

  lineSubTotal(dailyPrice: number, variantId: number): number {
    return dailyPrice * this.nights() * this.getQuantity(variantId);
  }

  // 沒有商品/款式照片時，依分類顯示對應的 Emoji 圖示，避免用隨機圖庫圖片混充內容
  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      帳篷: '🏕️',
      寢具: '🛏️',
      炊具: '🔥',
    };
    return icons[category] ?? '🎒';
  }

  backToList(): void {
    this.router.navigate(['/camp', this.campgroundId, 'rental'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }
}
