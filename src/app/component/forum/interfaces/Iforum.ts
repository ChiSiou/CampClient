export interface IForum {
  postId: number;
  userId: number;
  title: string;
  mainContent: string;
  imageUrl: string;
  postDate?: string | null;
  postCategoryId: number;
  userRole?: number | null;
  postTag: string;
  templateId?: number | null;
  campId?: number | null;
}
