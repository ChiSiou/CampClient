export interface IForum {
  postId: number;
  userId: number;
  userName?: string | null;
  title: string;
  mainContent: string;
  postDate?: string | null;
  postCategoryId: number;
  postCategoryName?: string | null;
  userRole?: number | null;
  postTag: string;
  templateId?: number | null;
  campId?: number | null;
  isHaveImgs?: boolean | null;
  moreImages?: IMoreImage[];
}

export interface IMoreImage {
  fromId?: number | null;
  imageUrl?: string | null;
}
