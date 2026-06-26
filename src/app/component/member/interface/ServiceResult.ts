export interface LoginResponse {
  token: string;
  roles: string[];
  activeRole: string;
}

export interface ServiceResult {
  success: boolean;
  message: string;
  loginResponse: LoginResponse;
}