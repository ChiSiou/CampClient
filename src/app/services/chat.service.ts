import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessageDto, MoreImageDto } from '../interfaces/chat.interface';

export interface ChatConversation {
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
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
  private openChatRequest$ = new Subject<{ otherUserId: number; otherUserName: string; otherUserAvatar?: string }>();

  onReceiveMessage() {
    return this.messageReceived$.asObservable();
  }

  onMessagesRead() {
    return this.messagesRead$.asObservable();
  }

  onOpenChatRequest() {
    return this.openChatRequest$.asObservable();
  }

  // 給其他元件呼叫的入口（例如營區頁的「聯絡營主」按鈕、營主後台的「聯絡客人」按鈕）
  // ChatWidget 掛在 app root，跟呼叫端不是父子關係，所以用這個 Subject 跨元件溝通
  openChatWith(otherUserId: number, otherUserName: string, otherUserAvatar?: string) {
    this.openChatRequest$.next({ otherUserId, otherUserName, otherUserAvatar });
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
