import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
<<<<<<< Updated upstream
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  providers: [MessageService],
=======
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
>>>>>>> Stashed changes
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('CampClient');
}
