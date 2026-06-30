import { MemberService } from './../../member/Service/member-service';
import { Sforum } from './../service/sforum';
import { SPostInteract } from './../service/sPostInteract';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IForum } from '../interfaces/Iforum';
import { IPostInteract } from '../interfaces/IPostInteract';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { Toast } from "primeng/toast";
import { IReply } from '../interfaces/IReply';
import { PrimeNG } from 'primeng/config';

interface UploadEvent {
  currentFiles: any;
  originalEvent: Event;
  files: File[];
}

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    AvatarModule,
    ButtonModule,
    DividerModule,
    PopoverModule,
    InputGroupModule,
    InputTextModule,
    RouterLink,
    FormsModule,
    TextareaModule,
    SelectModule,
    FileUploadModule,
    Toast
  ],
  templateUrl: './post.html',
  styleUrl: './post.scss',
  providers: [MessageService],
})
export class Post implements OnInit {

  post: IForum | null = null;
  editPosts: IForum[] = [];
  postId!: number;
  postRoute?: string = '';
  postMainPic?: string;
  isReplyPost: boolean = false;
  nowUserId?: number;
  isEditPost: boolean = false;
  edit_title: string = '';
  edit_mainContent: string = '';
  edit_moreImages: { fromId?: number | null; imageUrl?: string | null }[] = [];
  edit_selectedFiles: File[] = [];

  // 回覆
  replies: IReply[] = [];
  new_userId: number = 1;
  new_mainContent: string = '';
  new_isHaveImgs: boolean = false;
  private messageService = inject(MessageService);
  selectedFiles: File[] = [];
  uploadedImageUrls: string[] = [];
  isEditReply: boolean = false;
  editingReplyId: number | null = null;
  edit_replyContent: string = '';
  edit_reply_moreImages: { fromId?: number | null; imageUrl?: string | null }[] = [];
  edit_reply_selectedFiles: File[] = [];

  // 按讚／分享互動
  myInteract: IPostInteract | null = null;
  isLiked: boolean = false;
  likeCount: number = 0;
  likeBurst: boolean = false;

  postForm = {
    submitted: false,
    valid: false,
  };

  constructor(private sforumService: Sforum, private sPostInteractService: SPostInteract, private route: ActivatedRoute, private router: Router, private primeng: PrimeNG, private sMember: MemberService) {
    this.primeng.setTranslation({ pending: '等待上傳' });
  }

  ngOnInit(): void {
    this.nowUserId = Number(this.sMember.getid());
    this.postId = Number(this.route.snapshot.paramMap.get('id'));
    this.postRoute = window.location.href;
    this.sforumService.getPostById(this.postId).subscribe({
      next: (data) => {
        this.post = data;
        console.log(this.post);
        if (this.post?.isHaveImgs && this.post?.moreImages?.length) {
          this.postMainPic = this.post.moreImages?.[0]?.imageUrl ?? '';
        }
      },
      error: (err) => console.error('載入文章失敗', err),
    });

    this.loadReplies();
    this.loadInteracts();
  }

  loadInteracts() {
    this.sPostInteractService.getPostInteracts(this.postId).subscribe({
      next: (data) => {
        this.likeCount = data.filter(d => !!d.likePostId).length;
        const mine = data.find(d => d.userId === this.nowUserId) ?? null;
        this.myInteract = mine;
        this.isLiked = !!mine?.likePostId;
      },
      error: (err) => console.error('載入互動資料失敗', err),
    });
  }

  toggleLike() {
    if (!this.nowUserId) {
      this.messageService.add({
        severity: 'warn',
        summary: '尚未登入',
        detail: '請先登入後再按愛心收藏。',
        life: 3000,
      });
      return;
    }

    // 樂觀更新：先讓視覺立即反應，動畫播放後再依結果修正
    const nextLiked = !this.isLiked;
    this.isLiked = nextLiked;
    this.likeCount += nextLiked ? 1 : -1;
    this.likeBurst = nextLiked;

    if (!this.myInteract) {
      const param: IPostInteract = {
        postId: this.postId,
        userId: this.nowUserId,
        likePostId: nextLiked ? this.postId : null,
      };
      this.sPostInteractService.postPostInteract(param).subscribe({
        next: (created) => this.myInteract = created,
        error: (err) => {
          console.error('按愛心失敗', err);
          this.revertLike(nextLiked);
        },
      });
    } else {
      const param: IPostInteract = {
        ...this.myInteract,
        likePostId: nextLiked ? this.postId : null,
      };
      this.sPostInteractService.putPostInteract(this.myInteract.postInteractId!, param).subscribe({
        next: () => this.myInteract = param,
        error: (err) => {
          console.error('按愛心失敗', err);
          this.revertLike(nextLiked);
        },
      });
    }
  }

  private revertLike(attempted: boolean) {
    this.isLiked = !attempted;
    this.likeCount += attempted ? -1 : 1;
  }

  onHeartAnimationEnd() {
    this.likeBurst = false;
  }

  markShared() {
    if (!this.nowUserId || this.myInteract?.sharePostId) return;

    if (!this.myInteract) {
      const param: IPostInteract = {
        postId: this.postId,
        userId: this.nowUserId,
        sharePostId: this.postId,
      };
      this.sPostInteractService.postPostInteract(param).subscribe({
        next: (created) => this.myInteract = created,
        error: (err) => console.error('紀錄分享失敗', err),
      });
    } else {
      const param: IPostInteract = {
        ...this.myInteract,
        sharePostId: this.postId,
      };
      this.sPostInteractService.putPostInteract(this.myInteract.postInteractId!, param).subscribe({
        next: () => this.myInteract = param,
        error: (err) => console.error('紀錄分享失敗', err),
      });
    }
  }

  loadReplies() {
    this.sforumService.getReplyByPostId(this.postId).subscribe({
      next: (data) => this.replies = data,
      error: (err) => console.error('載入留言失敗', err),
    });
  }

  getMainImage() {
    return this.postMainPic ? this.postMainPic : 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1920';
  }

  copyPostRoute(): void {
    if (this.postRoute) {
      navigator.clipboard.writeText(this.postRoute);
    }
  }

  editPost(id: number) {
    if (!this.post) return;
    this.isEditPost = true;
    this.edit_title = this.post.title;
    this.edit_mainContent = this.post.mainContent;
    this.edit_moreImages = this.post.moreImages ? [...this.post.moreImages] : [];
    this.edit_selectedFiles = [];
  }

  cancelEditPost() {
    this.isEditPost = false;
    this.edit_selectedFiles = [];
  }

  onEditSelect(event: UploadEvent) {
    this.edit_selectedFiles = event.currentFiles;
  }

  removeEditImage(index: number) {
    this.edit_moreImages.splice(index, 1);
  }

  async submitEditPost() {
    if (!this.post) return;

    if (!this.edit_title.trim() || !this.edit_mainContent.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: '編輯失敗',
        detail: '標題與內容為必填欄位。',
        life: 3000,
      });
      return;
    }

    let newImageUrls: string[] = [];
    if (this.edit_selectedFiles.length > 0) {
      for (const file of this.edit_selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res: any = await this.sforumService.uploadImage(formData).toPromise();
        newImageUrls.push(res.imageUrl);
      }
    }

    const moreImages = [
      ...this.edit_moreImages,
      ...newImageUrls.map((url) => ({ imageUrl: url })),
    ];

    const param: IForum = {
      ...this.post,
      title: this.edit_title,
      mainContent: this.edit_mainContent,
      postTag: this.post.postTag ?? '',
      isHaveImgs: moreImages.length > 0,
      moreImages: moreImages,
    };

    this.sforumService.putPostAPI(this.post.postId, param).subscribe({
      next: () => {
        this.post = param;
        if (this.post.isHaveImgs && this.post.moreImages?.length) {
          this.postMainPic = this.post.moreImages[0]?.imageUrl ?? '';
        }
        this.isEditPost = false;
        this.edit_selectedFiles = [];
        this.messageService.add({
          severity: 'success',
          summary: '編輯成功',
          detail: '文章已更新。',
          life: 3000,
        });
      },
      error: (err) => {
        console.error('編輯失敗', err);
        this.messageService.add({
          severity: 'error',
          summary: '編輯失敗',
          detail: '請稍後再試。',
          life: 3000,
        });
      },
    });
  }

  deletePost(id: number) {
    if (confirm('確定要刪除這則貼文嗎？')) {
      this.sforumService.deletePost(id).subscribe({
        next: () => {
          this.editPosts = this.editPosts.filter(item => item.postId !== id);
          this.router.navigate(['/forum']);
        },
        error: (err) => {
          console.error('貼文刪除失敗', err);
        }
      });
    }
  }

  // 回覆
  onSelect(event: UploadEvent) {
    this.selectedFiles = event.currentFiles;
  }
  async uploadAllFiles(): Promise<void> {
    this.uploadedImageUrls = [];
    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await this.sforumService.uploadImage(formData).toPromise();
      this.uploadedImageUrls.push(res.imageUrl);
    }
    this.new_isHaveImgs = true;
  }

  onSubmit(form: any) {
    this.new_userId = Number(this.sMember.getid());

    if (this.new_mainContent.trim()) {
      form.valid = true;
    } else {
      form.valid = false;
    }

    if (!form.valid) {
      this.messageService.add({
        severity: 'error',
        summary: '發文失敗',
        detail: '請檢查必填欄位。',
        life: 3000,
      });
      return;
    }

    if (this.selectedFiles.length > 0) {
      this.uploadAllFiles().then(() => {
        this.addNewReply();
        this.isReplyPost = false;
      });
    } else {
      this.addNewReply();
      this.isReplyPost = false;
    }
  }

  addNewReply() {
    const param: IReply = {
      postId: this.postId,
      sendUserId: this.new_userId,
      replyContent: this.new_mainContent,
      isHaveImgs: this.new_isHaveImgs,
      moreImages: this.uploadedImageUrls.map((url) => ({ imageUrl: url })),
    };

    this.sforumService.postReply(param).subscribe({
      next: () => {
        this.loadReplies();
        this.new_mainContent = '';
        this.selectedFiles = [];
        this.uploadedImageUrls = [];
        this.new_isHaveImgs = false;

        this.messageService.add({
          severity: 'success',
          summary: '留言成功',
          detail: '回到討論區頁面。',
          life: 3000,
        });
      },
      error: (err) => {
        console.error('留言失敗', err);
        this.messageService.add({
          severity: 'error',
          summary: '留言失敗',
          detail: '請檢查是否已登入。',
          life: 3000,
        });
      },
    });
  }

  editReply(reply: IReply) {
    if (!reply.replyId) return;
    this.isEditReply = true;
    this.editingReplyId = reply.replyId;
    this.edit_replyContent = reply.replyContent;
    this.edit_reply_moreImages = reply.moreImages ? [...reply.moreImages] : [];
    this.edit_reply_selectedFiles = [];
  }

  cancelEditReply() {
    this.isEditReply = false;
    this.editingReplyId = null;
    this.edit_reply_selectedFiles = [];
  }

  onEditReplySelect(event: UploadEvent) {
    this.edit_reply_selectedFiles = event.currentFiles;
  }

  removeEditReplyImage(index: number) {
    this.edit_reply_moreImages.splice(index, 1);
  }

  async submitEditReply() {
    if (!this.editingReplyId) return;

    const reply = this.replies.find(r => r.replyId === this.editingReplyId);
    if (!reply) return;

    if (!this.edit_replyContent.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: '編輯失敗',
        detail: '留言內容為必填欄位。',
        life: 3000,
      });
      return;
    }

    let newImageUrls: string[] = [];
    if (this.edit_reply_selectedFiles.length > 0) {
      for (const file of this.edit_reply_selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res: any = await this.sforumService.uploadImage(formData).toPromise();
        newImageUrls.push(res.imageUrl);
      }
    }

    const moreImages = [
      ...this.edit_reply_moreImages,
      ...newImageUrls.map((url) => ({ imageUrl: url })),
    ];

    const param: IReply = {
      ...reply,
      replyContent: this.edit_replyContent,
      isHaveImgs: moreImages.length > 0,
      moreImages: moreImages,
    };

    this.sforumService.putReply(this.editingReplyId, param).subscribe({
      next: () => {
        this.loadReplies();
        this.isEditReply = false;
        this.editingReplyId = null;
        this.edit_reply_selectedFiles = [];
        this.messageService.add({
          severity: 'success',
          summary: '編輯成功',
          detail: '留言已更新。',
          life: 3000,
        });
      },
      error: (err) => {
        console.error('留言編輯失敗', err);
        this.messageService.add({
          severity: 'error',
          summary: '編輯失敗',
          detail: '請稍後再試。',
          life: 3000,
        });
      },
    });
  }

  deleteReply(id: number) {
    if (confirm('確定要刪除這則留言嗎？')) {
      this.sforumService.deleteReply(id).subscribe({
        next: () => {
          this.loadReplies();
          this.messageService.add({
            severity: 'success',
            summary: '刪除成功',
            detail: '留言已刪除。',
            life: 3000,
          });
        },
        error: (err) => {
          console.error('留言刪除失敗', err);
          this.messageService.add({
            severity: 'error',
            summary: '刪除失敗',
            detail: '請稍後再試。',
            life: 3000,
          });
        }
      });
    }
  }

}
