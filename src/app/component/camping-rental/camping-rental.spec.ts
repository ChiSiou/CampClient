import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// 定義與 .NET 欄位對齊的資料結構
export interface CampingGear {
  id: number;
  name: string;
  pricePerDay: number;
  imageUrl: string;
  stock: number;
}

@Component({
  selector: 'app-camping-rental',
  templateUrl: './camping-rental.component.html',
  styleUrls: ['./camping-rental.component.css']
})
export class CampingRentalComponent implements OnInit {
  // 新版 Angular 推薦使用 inject 的方式注入 HttpClient
  private http = inject(HttpClient);

  // 儲存從 .NET API 撈出來的露營裝備陣列
  gears: CampingGear[] = [];

  ngOnInit(): void {
    this.loadCampingGears();
  }

  // 呼叫 .NET API 取得資料
  loadCampingGears() {
    this.http.get<CampingGear[]>(`${environment.apiUrl}/camping/gears`)
      .subscribe({
        next: (data) => {
          this.gears = data; // 成功把 .NET 的 JSON 資料倒進前端變數
        },
        error: (err) => {
          console.error('無法連線到 .NET API，請檢查後端是否有啟動或 CORS 是否開啟：', err);
        }
      });
  }

  // 點擊租借按鈕
  rentGear(gear: CampingGear) {
    const orderData = { gearId: gear.id, quantity: 1 };

    // POST 送出訂單給 .NET
    this.http.post(`${environment.apiUrl}/camping/rent`, orderData)
      .subscribe({
        next: (res) => alert(`成功租借：${gear.name}！`),
        error: (err) => alert('租借失敗：' + err.message)
      });
  }
}
