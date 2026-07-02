export interface OwnerCampgroundOption {
  campId: number;
  name: string;
}

export interface OwnerReviewListItem {
  reviewId: number;
  campId: number;
  campName: string;
  userId: number | null;
  userName: string;
  rating: number;
  commentText: string | null;
  createdAt: string | null;
  imageUrls: string[];
  ownerReplyContent: string | null;
  ownerReplyAt: string | null;
  hasOpenReport: boolean;
}

export interface OwnerReviewListResult {
  items: OwnerReviewListItem[];
  totalCount: number;
}

export interface ReplyRequest {
  content: string;
}

export interface ReportReviewRequest {
  reasonType: number;
  reasonDetail: string;
}

// 檢舉原因分類，對應後端 Report.ReasonType（byte）
export const REPORT_REASON_OPTIONS: { label: string; value: number }[] = [
  { label: '不實評論', value: 0 },
  { label: '惡意辱罵/人身攻擊', value: 1 },
  { label: '廣告/垃圾訊息', value: 2 },
  { label: '其他', value: 3 },
];
