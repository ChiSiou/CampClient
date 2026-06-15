import { Component } from '@angular/core';
import { SReview } from '../service/sreview';
import { IReview } from '../interfaces/IReview';

@Component({
  selector: 'app-review',
  imports: [],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review {

    constructor(private sReview: SReview) { }

  Reviews: IReview[] = [];

  ngOnInit(): void {
    this.sReview.getRiviewAPI().subscribe((data) => {
      this.Reviews = data;
      console.log(data);
    });
  }

}
