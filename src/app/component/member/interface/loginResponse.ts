export interface LoginResponseDto {
  token: string;
  roles: string[];
  activeRole: string;
}

export interface ServiceResultDto {
  success: boolean;
  message: string;
  loginResponse: LoginResponseDto;
}