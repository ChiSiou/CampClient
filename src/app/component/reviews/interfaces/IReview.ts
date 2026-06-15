export interface IReview {
  reviewId: number,
  userId: number,
  campId: number,
  rating: number,
  commentText: string,
  isHaveImgs: boolean,
  status: number,
  createdAt: Date,
  updatedAt: Date,
  reviewAtId: number,
  orderId: number,
  userRole: number,
}
