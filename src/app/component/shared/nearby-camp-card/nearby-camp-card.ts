import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { NearbyCampItem } from '../../../interfaces/camp.interface';

/**
 * 共用附近營區卡片元件
 * 使用場景：camp-detail 周邊探索、attraction-detail 順遊推薦
 * 透過 cardEnter / cardLeave 輸出事件讓父元件控制地圖 popup
 */
@Component({
  selector: 'app-nearby-camp-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './nearby-camp-card.html',
  styleUrl: './nearby-camp-card.css',
})
export class NearbyCampCard {
  @Input() camp!: NearbyCampItem;

  /** hover 進入時發出 campId，父元件可用來開啟地圖 popup */
  @Output() cardEnter = new EventEmitter<number>();

  /** hover 離開時發出，父元件可用來關閉地圖 popup */
  @Output() cardLeave = new EventEmitter<void>();
}
