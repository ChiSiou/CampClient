import { Component, inject, NgModule } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AvatarModule, Avatar } from 'primeng/avatar';
import { DialogModule, Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SReview } from '../service/sreview';
import { IReview } from '../interfaces/IReview';
import { FileUploadModule } from 'primeng/fileupload';
import { FloatLabelModule, FloatLabel } from 'primeng/floatlabel';
import { ReactiveFormsModule } from '@angular/forms';
import { Message, MessageModule } from 'primeng/message';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { Button, ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

interface UploadEvent {
  originalEvent: Event;
  files: File[];
}

@Component({
  selector: 'app-popup',
  imports: [
    Button,
    Dialog,
    Avatar,
    FileUploadModule,
    ToastModule,
    FloatLabel,
    FormsModule,
    RatingModule,
    ReactiveFormsModule,
    Message,
  ],
  templateUrl: './popup.html',
  styleUrl: './popup.css',
  providers: [MessageService],
})
export class Popup {
  // 資料
  reviews: IReview[] = [];
  new_reviewId: number = 0;
  new_userId: number = 1;
  new_campId: number = 1;
  new_rating: number = 0;
  new_commentText: string = '';
  new_isHaveImgs: boolean = false;
  new_status: number = 0;
  new_createdAt: Date | null = null;
  new_updatedAt: Date | null = null;
  new_reviewAtId: number = 0;
  new_orderId: number = 0;
  new_userRole: number = 0;

  // 使用者傳圖
  private messageService = inject(MessageService);
  selectedFiles: File[] = [];
  uploadedImageUrls: string[] = [];

  // 畫面
  visible: boolean = false;
  commentTip = '評論';
  reviewForm = {
    submitted: false,
    valid: false,
  };

  constructor(private sReview: SReview) {}

  showDialog() {
    this.visible = true;
  }

  onSelect(event: any) {
    this.selectedFiles = event.currentFiles;
  }

  onSubmit(form: any) {
    if (this.new_rating > 0) {
      form.valid = true;
    } else {
      form.valid = false;
    }

    if (!form.valid) {
      this.messageService.add({
        severity: 'error',
        summary: '評論失敗',
        detail: '請檢查必填欄位。',
        life: 3000,
      });
      return;
    }

    if (this.selectedFiles.length > 0) {
      this.uploadAllFiles().then(() => {
        this.addNewReview();
        this.messageService.add({
          severity: 'success',
          summary: '評論成功',
          detail: '回到訂單頁面。',
          life: 3000,
        });
        this.visible = false;
      });
    } else {
      this.addNewReview();
      this.messageService.add({
        severity: 'success',
        summary: '評論成功',
        detail: '回到訂單頁面。',
        life: 3000,
      });
      this.visible = false;
    }
  }

  async uploadAllFiles(): Promise<void> {
    this.uploadedImageUrls = [];
    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await this.sReview.uploadImage(formData).toPromise();
      this.uploadedImageUrls.push(res.imageUrl);
    }
    this.new_isHaveImgs = true;
  }

  addNewReview() {
    let param = {
      reviewId: this.new_reviewId,
      userId: this.new_userId,
      campId: this.new_campId,
      rating: this.new_rating,
      commentText: this.new_commentText,
      isHaveImgs: this.new_isHaveImgs,
      status: this.new_status,
      createdAt: this.new_createdAt,
      updatedAt: this.new_updatedAt,
      reviewAtId: this.new_reviewAtId,
      orderId: this.new_orderId,
      userRole: this.new_userRole,
      reviewImages: this.uploadedImageUrls.map((url) => ({ imageUrl: url })),
    };
    this.sReview.postRiviewAPI(param).subscribe((data) => {
      this.reviews.push(param);
      data = this.reviews;
      console.log(data);
    });
  }
}
