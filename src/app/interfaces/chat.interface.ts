export interface MoreImageDto {
  picId: number;
  fromWhere?: string | null;
  fromId?: number | null;
  imageUrl: string;
}

export interface ChatMessageDto {
  messageId: number;
  sendUserId: number;
  sendUserName?: string | null;
  receiveUserId: number;
  receiveUserName?: string | null;
  contents: string;
  isRead?: boolean | null;
  sendTime: string;
  sendUserRole: number;
  receiveUserRole: number;
  isHaveImgs?: boolean | null;
  moreImages: MoreImageDto[];
}
