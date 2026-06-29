export interface LoginResponse {
  token: string;
  roles: string[];
  activeRole: string;
}

// 後端 /api/Member/login 實際回傳的是扁平結構（沒有 loginResponse 包裝層）
export type ServiceResult = LoginResponse;