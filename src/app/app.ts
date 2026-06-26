import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ToastModule } from 'primeng/toast';
import { MemberService } from './component/member/Service/member-service';
import { ChatWidget } from './component/shared/chat-widget/chat-widget';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ToastModule, ChatWidget],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('CampClient');

  constructor(public memberservice: MemberService) {}
  ngOnInit(): void {
    if (this.memberservice.isAuthenticated()) {
      this.memberservice.startTokenTimer();
    }
  }
}
