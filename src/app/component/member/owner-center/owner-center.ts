import { Component } from '@angular/core';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-owner-center',
  imports: [],
  templateUrl: './owner-center.html',
  styleUrl: './owner-center.css',
})
export class OwnerCenter {
  constructor(private chatService: ChatService) {}

  // TODO: 訂單清單接上真實 API 後，改成用該筆訂單的 customerId/customerName
  contactCustomer(customerId: number, customerName: string) {
    this.chatService.openChatWith(customerId, customerName);
  }
}
