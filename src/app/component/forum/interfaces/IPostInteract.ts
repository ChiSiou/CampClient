export interface IPostInteract {
  postInteractId?: number;
  postId: number;
  userId: number;
  userName?: string | null;
  likePostId?: number | null;
  sharePostId?: number | null;
  userRole?: number | null;
}
