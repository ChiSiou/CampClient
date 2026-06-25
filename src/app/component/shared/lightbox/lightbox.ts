import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * 共用 Lightbox 元件
 * 使用場景：camp-detail / attraction-detail 照片全螢幕瀏覽
 * 為何自製而不用 PrimeNG Galleria：
 *   PrimeNG 21 fullscreen portal 在 Angular zone 外渲染，
 *   導致 prev/next 按鈕 click 無法觸發 change detection。
 */
@Component({
  selector: 'app-lightbox',
  standalone: true,
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.css',
})
export class Lightbox {
  /** 圖片 URL 陣列 */
  @Input() images: string[] = [];

  /** 控制是否顯示，支援 [(visible)] 雙向綁定 */
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** 目前顯示的圖片索引，支援 [(activeIndex)] 雙向綁定 */
  @Input() activeIndex = 0;
  @Output() activeIndexChange = new EventEmitter<number>();

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  prev() {
    const next = (this.activeIndex - 1 + this.images.length) % this.images.length;
    this.activeIndex = next;
    this.activeIndexChange.emit(next);
  }

  next() {
    const next = (this.activeIndex + 1) % this.images.length;
    this.activeIndex = next;
    this.activeIndexChange.emit(next);
  }
}
