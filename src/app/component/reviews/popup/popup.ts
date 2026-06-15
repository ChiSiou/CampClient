import { Component } from '@angular/core';
import { AvatarModule, Avatar } from 'primeng/avatar';
import { ButtonModule, Button } from 'primeng/button';
import { DialogModule, Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-popup',
  imports: [Button, Dialog, Avatar],
  templateUrl: './popup.html',
  styleUrl: './popup.css',
})
export class Popup {


  visible: boolean = false;
  showDialog() {
    this.visible = true;
  }

}
