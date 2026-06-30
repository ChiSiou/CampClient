export interface LoginResponse {
  token: string;
  roles: string[];
  activeRole: string;
}

export interface ServiceResult {
  success: boolean;
  message: string;
  uploadOwnerProfilePhoto?: UploadOwnerProfilePhoto;
}

export interface LoginServiceResult extends ServiceResult {
  loginResponse: LoginResponse;
}
export interface UploadOwnerProfilePhoto {
  imageUrl: string;
  mediaId: number;
}
