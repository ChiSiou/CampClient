import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessageDto, MoreImageDto } from '../interfaces/chat.interface';

export interface ChatConversation {
  otherUserId: number;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = environment.apiUrl;
  private hubUrl = environment.apiUrl.replace(/\/api$/, '') + '/hubs/chat';

  private hubConnection?: signalR.HubConnection;

  private messageReceived$ = new Subject<ChatMessageDto>();
  private messagesRead$ = new Subject<{ readerId: number }>();

  onReceiveMessage() {
    return this.messageReceived$.asObservable();
  }

  onMessagesRead() {
    return this.messagesRead$.asObservable();
  }

  constructor(private http: HttpClient) {}

  // 整個 App 登入後呼叫一次即可，視窗開關不用重新連線
  connect() {
    if (this.hubConnection) {
      return Promise.resolve();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
        // 認證走 JWT bearer token，不需要 cookie；後端 CORS 是 AllowAnyOrigin()，
        // 跟 withCredentials:true 不能並存（瀏覽器會擋 preflight），所以這裡關掉
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveMessage', (dto: ChatMessageDto) => {
      this.messageReceived$.next(dto);
    });

    this.hubConnection.on('MessagesRead', (payload: { readerId: number }) => {
      this.messagesRead$.next(payload);
    });

    return this.hubConnection.start();
  }

  disconnect() {
    this.hubConnection?.stop();
    this.hubConnection = undefined;
  }

  sendMessage(
    receiveUserId: number,
    contents: string,
    sendUserRole: number,
    receiveUserRole: number,
    images?: Pick<MoreImageDto, 'imageUrl'>[],
  ) {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject(new Error('聊天連線尚未建立'));
    }

    return this.hubConnection.invoke(
      'SendMessage',
      receiveUserId,
      contents,
      sendUserRole,
      receiveUserRole,
      images ?? [],
    );
  }

  markAsRead(otherUserId: number) {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }
    return this.hubConnection.invoke('MarkAsRead', otherUserId);
  }

  // 對話清單（聊天視窗左側列表）
  getConversations(userId: number) {
    return this.http.get<ChatConversation[]>(`${this.base}/APIChat/conversations`, {
      params: { userId },
    });
  }

  // 跟特定對象的雙向歷史訊息
  getConversation(userId: number, withUserId: number, page = 1, size = 50) {
    return this.http.get<ChatMessageDto[]>(`${this.base}/APIChat/conversation`, {
      params: { userId, withUserId, page, size },
    });
  }

  uploadImage(formData: FormData) {
    return this.http.post<{ imageUrl: string }>(`${this.base}/Upload/chat-image`, formData);
  }
}
