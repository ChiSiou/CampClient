export interface MemberEdit {
  Name: string;
  Phone: string;
  Email: string;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}
