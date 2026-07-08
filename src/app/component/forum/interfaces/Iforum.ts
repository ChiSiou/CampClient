export interface IForum {
  postId: number;
  userId: number;
  userName?: string | null;
  avatarUrl?: string | null;
  title: string;
  mainContent: string;
  postDate?: string | null;
  postCategoryId: number;
  postCategoryName?: string | null;
  userRole?: number | null;
  postTag: string;
  templateId?: number | null;
  campId?: number | null;
  attractionId?: number | null;
  isHaveImgs?: boolean | null;
  likeCount?: number;
  commentCount?: number;
  moreImages?: IMoreImage[];
  campCard?: IPostEmbedCard | null;
  attractionCard?: IPostEmbedCard | null;
}

export interface IMoreImage {
  fromId?: number | null;
  imageUrl?: string | null;
}

export interface IPostEmbedCard {
  id: number;
  name: string;
  coverImageUrl?: string | null;
  subtitle?: string | null;
}
