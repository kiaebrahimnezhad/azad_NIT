
export interface otpResponse {
    message: string;
}

export interface LoginResponse {
  token: string;
  userType: string;
  message: string;
}

export interface EmailResponse {
    message: string
}

export interface SampleFormResult{
    show: boolean,
    success:  boolean,
    message: string | null;
}

export type PublicContext = {
    userName: string, 
    setUserName: (arg0: string) => void,
    isUserLogin: boolean, 
    setIsUserLogin: (arg0: boolean) => void,
    token: string,
    setToken: (arg0: string) => void,
    userType: string, 
    setUserType: (arg0: string) => void
}

export type Auth = {
    username: string,
    userType: string
}
