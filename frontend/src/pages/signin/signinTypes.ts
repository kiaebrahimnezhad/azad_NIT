export type UserInfo = {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  field: string;
  mail: string;
};

export type SigninContext = {
    mail: string,
    setMail: ((arg0: string) => void),
    isOtpTime: boolean,
    setIsOtpTime: ((arg0: boolean) => void),
    setUser: (arg0: UserInfo) => void
} | undefined;

export interface OtpRequest {
  mail: string | undefined;
  otp: string;
}