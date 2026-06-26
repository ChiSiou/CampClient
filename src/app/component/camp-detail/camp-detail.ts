import { Component } from '@angular/core';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-camp-detail',
  imports: [],
  templateUrl: './camp-detail.html',
  styleUrl: './camp-detail.css',
})
export class CampDetail {
  constructor(private chatService: ChatService) {}

  // TODO: 這頁的 API 還沒接，等 CampDetailDto 補上營主 OwnerUserId/OwnerName 後改成真實資料
  contactOwner() {
    this.chatService.openChatWith(99946, '營主');
  }
}
