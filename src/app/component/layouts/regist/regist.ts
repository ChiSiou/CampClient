import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-regist',
  imports: [FormsModule, RouterLink, RouterOutlet],
  templateUrl: './regist.html',
  styleUrl: './regist.css',
})
export class Regist {

}
