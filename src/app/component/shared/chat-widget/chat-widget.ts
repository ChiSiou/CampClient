import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatService, ChatConversation } from '../../../services/chat.service';
import { ChatMessageDto, MoreImageDto } from '../../../interfaces/chat.interface';
import { MemberService } from '../../member/Service/member-service';

// Role 表（dbo.Role）目前實際在用的三個角色 Id，1/2/3 是舊資料不要用
const ROLE_ADMIN = 8;
const ROLE_USER = 9;
const ROLE_OWNER = 10;

// 平台客服帳號（暫定，先用這個測試帳號）
const SUPPORT_USER_ID = 99925;
const SUPPORT_ROLE_ID = ROLE_USER;

interface PendingImage {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
})
export class ChatWidget implements OnInit, OnDestroy {
  isOpen = false;
  conversations: ChatConversation[] = [];
  activeConversation: ChatConversation | null = null;
  messages: ChatMessageDto[] = [];
  newMessageText = '';
  myUserId = 0;
  avatarErrorIds = new Set<number>();
  pendingImages: PendingImage[] = [];
  isSending = false;

  private subs: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private memberService: MemberService,
  ) {}

  ngOnInit(): void {
    if (!this.memberService.isAuthenticated()) {
      return;
    }

    this.myUserId = +this.memberService.getid();

    this.chatService.connect().then(() => this.loadConversations());

    this.subs.push(
      this.chatService.onReceiveMessage().subscribe((dto) => this.handleIncomingMessage(dto)),
    );

    this.subs.push(
      this.chatService.onMessagesRead().subscribe(({ readerId }) => {
        if (this.activeConversation?.otherUserId === readerId) {
          this.messages = this.messages.map((m) => ({ ...m, isRead: true }));
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.clearPendingImages();
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.conversations.length === 0) {
      this.loadConversations();
    }
  }

  loadConversations() {
    this.chatService.getConversations(this.myUserId).subscribe((list) => {
      this.conversations = list;
    });
  }

  openConversation(conv: ChatConversation) {
    this.activeConversation = conv;
    conv.unreadCount = 0;

    this.chatService.getConversation(this.myUserId, conv.otherUserId).subscribe((msgs) => {
      this.messages = msgs;
    });

    this.chatService.markAsRead(conv.otherUserId);
  }

  // 找客服：沒有現成對話就先開一個空白視窗，第一則訊息送出後 conversations 清單會自動補上
  startSupportChat() {
    const existing = this.conversations.find((c) => c.otherUserId === SUPPORT_USER_ID);
    if (existing) {
      this.openConversation(existing);
      return;
    }

    this.activeConversation = {
      otherUserId: SUPPORT_USER_ID,
      otherUserName: '平台客服',
      lastMessage: '',
      lastMessageTime: '',
      unreadCount: 0,
    };
    this.messages = [];
  }

  // 找客服走固定的客服角色，其他對話先當成「找營主」處理
  private receiveRoleFor(otherUserId: number): number {
    return otherUserId === SUPPORT_USER_ID ? SUPPORT_ROLE_ID : ROLE_OWNER;
  }

  // 目前活躍角色預設當一般使用者，營主後台另開的聊天視窗之後可以再覆寫這個值
  private get myRole(): number {
    return ROLE_USER;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    for (const file of files) {
      this.pendingImages.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    input.value = '';
  }

  removePendingImage(index: number) {
    URL.revokeObjectURL(this.pendingImages[index].previewUrl);
    this.pendingImages.splice(index, 1);
  }

  private clearPendingImages() {
    this.pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    this.pendingImages = [];
  }

  async send() {
    const text = this.newMessageText.trim();
    if ((!text && this.pendingImages.length === 0) || !this.activeConversation || this.isSending) {
      return;
    }

    this.isSending = true;

    try {
      const images: Pick<MoreImageDto, 'imageUrl'>[] = [];
      for (const pending of this.pendingImages) {
        const formData = new FormData();
        formData.append('file', pending.file);
        const res = await this.chatService.uploadImage(formData).toPromise();
        if (res) {
          images.push({ imageUrl: res.imageUrl });
        }
      }

      await this.chatService.sendMessage(
        this.activeConversation.otherUserId,
        text,
        this.myRole,
        this.receiveRoleFor(this.activeConversation.otherUserId),
        images,
      );

      this.newMessageText = '';
      this.clearPendingImages();
    } catch {
      // 連線斷掉或上傳失敗先靜默失敗，之後可以加 Toast 提示
    } finally {
      this.isSending = false;
    }
  }

  private handleIncomingMessage(dto: ChatMessageDto) {
    const otherUserId = dto.sendUserId === this.myUserId ? dto.receiveUserId : dto.sendUserId;

    if (this.activeConversation?.otherUserId === otherUserId) {
      this.messages = [...this.messages, dto];
      if (dto.sendUserId !== this.myUserId) {
        this.chatService.markAsRead(otherUserId);
      }
    }

    this.upsertConversationPreview(dto, otherUserId);
  }

  private upsertConversationPreview(dto: ChatMessageDto, otherUserId: number) {
    const isActiveAndOpen = this.isOpen && this.activeConversation?.otherUserId === otherUserId;
    const otherUserName =
      dto.sendUserId === otherUserId ? dto.sendUserName : dto.receiveUserName;

    const existing = this.conversations.find((c) => c.otherUserId === otherUserId);
    const preview = dto.isHaveImgs ? '[圖片]' : dto.contents;

    if (existing) {
      existing.lastMessage = preview;
      existing.lastMessageTime = dto.sendTime;
      if (!isActiveAndOpen && dto.sendUserId !== this.myUserId) {
        existing.unreadCount += 1;
      }
    } else {
      this.conversations.unshift({
        otherUserId,
        otherUserName: otherUserName ?? '',
        lastMessage: preview,
        lastMessageTime: dto.sendTime,
        unreadCount: !isActiveAndOpen && dto.sendUserId !== this.myUserId ? 1 : 0,
      });
    }

    this.conversations.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
    );
  }

  get totalUnread() {
    return this.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  }

  avatarUrl(userId: number) {
    return `${environment.apiUrl}/Member/GetProfilePhoto/${userId}`;
  }

  onAvatarError(userId: number) {
    this.avatarErrorIds.add(userId);
  }

  initialOf(name: string) {
    return name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  }
}
