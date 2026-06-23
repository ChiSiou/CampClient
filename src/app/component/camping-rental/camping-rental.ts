import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-camping-rental',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camping-rental.html',
  styleUrls: ['./camping-rental.css']
})
export class CampingRentalComponent implements OnInit {
  private http = inject(HttpClient);

  // 用來存放從 Exploration API 撈出來的營地/首頁資料
  homeData: any = null;

  ngOnInit(): void {
    this.loadCampgroundData();
  }

  loadCampgroundData() {
    // 依據你的 Swagger 網址：https://localhost:7011
    const apiUrl = 'https://localhost:7011/api/Products/1';

    this.http.get<any>(apiUrl).subscribe({
      next: (data) => {
        this.homeData = data;
        console.log('成功拿到 .NET 營地首頁資料：', this.homeData);
      },
      error: (err) => {
        console.error('串接 .NET API 失敗。請檢查：1.後端有啟動 2.CORS已開啟。錯誤訊息：', err);
      }
    });
  }

  // 點擊租借或查看詳情
  onSelectCamp(campId: number) {
    alert(`你選擇了營地 ID: ${campId}，準備進入預訂/租借流程！`);
  }
}
