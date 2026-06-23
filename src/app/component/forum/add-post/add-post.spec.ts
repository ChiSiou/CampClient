import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPost } from './add-post';

describe('AddPost', () => {
  let component: AddPost;
  let fixture: ComponentFixture<AddPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPost);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
