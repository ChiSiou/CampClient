export interface IReply {
  postId: number;
  sendUserId: number;
  sendUserName?: string | null;
  replyContent: string;
  createdAt?: string | null;
  sendUserRole?: number | null;
  isHaveImgs?: boolean | null;
  moreImages?: IMoreImage[];
}

export interface IMoreImage {
  fromId?: number | null;
  imageUrl?: string | null;
}
