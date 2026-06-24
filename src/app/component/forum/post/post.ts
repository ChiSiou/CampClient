import { MemberService } from './../../member/Service/member-service';
import { Sforum } from './../service/sforum';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IForum } from '../interfaces/Iforum';
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
  postId!: number;
  postRoute?: string = '';
  postMainPic?: string;
  isReplyPost: boolean = false;

  // 回覆
  replies: IReply[] = [];
  new_userId: number = 1;
  new_mainContent: string = '';
  new_isHaveImgs: boolean = false;
  private messageService = inject(MessageService);
  selectedFiles: File[] = [];
  uploadedImageUrls: string[] = [];

  postForm = {
    submitted: false,
    valid: false,
  };

  constructor(private sforumService: Sforum, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
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
      });
    } else {
      this.addNewReply();
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
          summary: '發文失敗',
          detail: '請稍後再試。',
          life: 3000,
        });
      },
    });
  }

}
