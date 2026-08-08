export type LoginContext = {
    isForgotPass: boolean,
    setIsForgotPass: (arg0: boolean) => void
} 

export type UserInfo = {
    username: string;
    password: string;
}

export type UserInfoForgot = {
        mail: string,
        otp: string,
        newPassword: string
    }