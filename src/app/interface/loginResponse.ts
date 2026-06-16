export interface LoginResponse {
  token: string;
  user: {
    userId: number;
    email: string;
    name: string;
    role: string;
  };
}
