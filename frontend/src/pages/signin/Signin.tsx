import React, { createContext, useContext, useState } from "react";
import type { OtpRequest, SigninContext, UserInfo } from "./signinTypes";
import Input from "../../components/Input";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import useWindowSize from "../../hooks/useWindowSize";
import { iamApi } from "../../lib/api";
import type {
  otpResponse,
  LoginResponse,
  SampleFormResult,
} from "../../types/publicTypes";
import { useAuth } from "../../context/AuthContext";

// context for signin page
const signinContext = createContext<SigninContext>(undefined);

// Siginin page component
function Signin() {
  const [isOtpTime, setIsOtpTime] = useState<boolean>(false);
  const [mail, setMail] = useState<string>("");

  const [user, setUser] = useState<UserInfo>({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    field: "",
    mail: "",
  });

  return (
    <signinContext.Provider
      value={{ mail, setMail, isOtpTime, setIsOtpTime, setUser }}
    >
      <section className="grid grid-cols-12 p-10 md:p-15 lg:px-45 bg-[#F7F2EF] md:h-auto">
        <div className="col-span-12 lg:col-span-7 bg-[#ffffff] rounded-4xl lg:rounded-l-none">
          <SigninForm />
        </div>
        <div className="hidden lg:block lg:col-span-5 bg-[#50A6CD] rounded-4xl lg:rounded-r-none text-white ">
          {isOtpTime ? <OtpForm user={user} /> : <Welcome />}
        </div>
      </section>
    </signinContext.Provider>
  );
}

export default Signin;

//-- -- -- --| Signin page module

//
function SigninForm() {
  const [userInf, setUserInf] = useState<UserInfo>({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    field: "",
    mail: "",
  });

  const [rptPass, setRptPass] = useState<string>("");

  const [signinResult, setSigninResult] = useState<SampleFormResult>({
    show: false,
    success: false,
    message: null,
  });

  const context = useContext(signinContext);

  const { width } = useWindowSize();

  const userInfHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInf((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const signinHandler = () => {
    iamApi
      .post("/sign-up", userInf)
      .then(() => {
        context?.setIsOtpTime(true);

        context?.setMail(userInf.mail);

        context?.setUser(userInf);

        setSigninResult({
          show: true,
          success: true,
          message: "ثبت‌نام اولیه با موفقیت انجام شد.",
        });
      })
      .catch((err) => {
        console.error(err);
        setSigninResult({
          show: true,
          success: false,
          message: "خطایی رخ داد. لطفا دوباره امتحان کنید.",
        });
      });
  };

  let signinPageInputsClass =
    "border-gray-500 border-1 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5 md:py-4 lg:py-2.5 disabled:bg-[#c3c3c3] ";
  let signinPageButtonClass =
    "bg-[#50A6CD] hover:bg-blue-700 disabled:bg-gray-500 rounded-2xl text-white font-bold py-2 ";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            فرم ثبت‌نام
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            name="first_name"
            type="text"
            label="نام"
            placeholder="محمد "
            id="1"
            onChange={userInfHandler}
            inpClass={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 ${signinPageInputsClass}`}
            divClass="space-y-2"
            disabled={context?.isOtpTime}
          />

          <Input
            name="last_name"
            type="text"
            label="نام خانوادگی"
            placeholder="محمدی"
            id="2"
            onChange={userInfHandler}
            inpClass={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 ${signinPageInputsClass}`}
            divClass="space-y-2"
            disabled={context?.isOtpTime}
          />

          <Input
            name="mail"
            type="email"
            label="پست الکترونیکی"
            placeholder="mohammad_mohammadi@gmail.com"
            id="3"
            onChange={userInfHandler}
            inpClass={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 ${signinPageInputsClass}`}
            divClass="space-y-2"
            disabled={context?.isOtpTime}
          />

          <Input
            name="username"
            type="text"
            label="نام کاربری"
            placeholder="کیارش ابراهیم نژاد"
            description=""
            id="4"
            onChange={userInfHandler}
            inpClass={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 ${signinPageInputsClass}`}
            divClass="space-y-2"
            disabled={context?.isOtpTime}
          />
        </div>

        {/* Field Select - Full Width */}
        <div className="space-y-2">
          <label htmlFor="field" className="block text-gray-700 font-medium">
            رشته
          </label>
          <select
            id="field"
            name="field"
            value={userInf.field}
            onChange={(e) =>
              setUserInf((prev) => ({ ...prev, field: e.target.value }))
            }
            disabled={context?.isOtpTime}
            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl 
                focus:border-blue-500 focus:outline-none transition-all duration-300
                ${signinPageInputsClass}`}
          >
            <option value="">انتخاب کنید...</option>
            <option value="عمومی">عمومی</option>
            <option value="علوم پایه">علوم پایه</option>
            <option value="برق و کامپیوتر">برق و کامپیوتر</option>
            <option value="مکانیک">مکانیک</option>
            <option value="عمران و معماری">عمران و معماری</option>
            <option value="صنایع و مدیریت">صنایع و مدیریت</option>
          </select>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            name="password"
            type="password"
            label="رمز عبور"
            placeholder="mOHam_d@1330"
            description="لطفا رمز عبور خود را انتخاب نمایید."
            id="6"
            onChange={userInfHandler}
            inpClass={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 ${signinPageInputsClass}`}
            divClass="space-y-2"
            disabled={context?.isOtpTime}
          />

          <Input
            name="rPassword"
            type="password"
            label="تکرار رمز عبور"
            placeholder="رمز عبور قبلی را تکرار کنید"
            id="7"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setRptPass(e.target.value);
            }}
            inpClass={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 ${signinPageInputsClass}`}
            divClass="space-y-2"
            disabled={context?.isOtpTime}
          />
        </div>

        {/* Status Message */}
        {signinResult.show && (
          <div className="text-center p-4 rounded-xl bg-gray-50">
            <div
              className={`font-medium text-lg ${
                signinResult.success ? "text-green-600" : "text-red-600"
              }`}
            >
              <p className="flex items-center justify-center gap-2">
                {signinResult.success ? (
                  <>
                    <span>موفقیت! کد شما ارسال شد</span>
                    <span className="text-2xl">✅</span>
                  </>
                ) : (
                  <span className="text-2xl">⛔</span>
                )}
              </p>
              <p className="mt-2 text-sm">{signinResult.message}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            divClass="w-full max-w-xs"
            butClass={`w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${signinPageButtonClass}`}
            handler={signinHandler}
            disabled={
              context?.isOtpTime ||
              userInf.first_name === "" ||
              userInf.last_name === "" ||
              userInf.field === "" ||
              userInf.mail === "" ||
              userInf.password === "" ||
              rptPass !== userInf.password
            }
          >
            ثبت‌نام
          </Button>
        </div>

        {/* Login Link */}
        <div className="text-center pt-6 border-t border-gray-100 lg:hidden">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors duration-200 font-medium"
          >
            <span>حساب کاربری دارید؟</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {/* OTP Form */}
        {context?.isOtpTime && width < 1024 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
            <OtpForm user={userInf} />
          </div>
        )}
      </div>
    </div>
  );
}

function OtpForm({ user }: { user: UserInfo }) {
  const context = useContext(signinContext);
  const { login } = useAuth();

  const navigate = useNavigate();

  const { width } = useWindowSize();

  const [otpReq, setOtpReq] = useState<OtpRequest>({
    mail: context?.mail,
    otp: "",
  });

  const [otpResult, setOtpResult] = useState<SampleFormResult>({
    show: false,
    success: false,
    message: "",
  });

  const editData = () => {
    context?.setIsOtpTime(false);
  };

  const otpReqHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpReq((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const otpHandler = () => {
    iamApi
      .post<otpResponse>("/sign-up/verify-otp", otpReq)
      .then(() => {
        setOtpResult({
          message: "موفقیت",
          show: true,
          success: true,
        });

        setTimeout(() => {
          iamApi
            .post<LoginResponse>("/login", user)
            .then((response) => {
              const { token, userType } = response.data;
              login({ username: user.username, token, userType });
              navigate("/user/course");
            })
            .catch(() => {
              setOtpResult({
                message:
                  "ثبت‌نام انجام شد! اما در ورود مشکلی پیش آمده. لطفا از طریق صفحه ورود اقدام کنید.",
                show: true,
                success: false,
              });
            });
        }, 2000);
      })
      .catch(() => {
        setOtpResult({
          message: "خطایی رخ داده!",
          show: true,
          success: false,
        });
      });
  };

  if (width >= 1024) {
    return (
      <section className=" h-full lg:relative border-1">
        <div className="absolute h-1/3 top-1/3 bottom-1/3 left-0 right-0">
          <div>
            <p
              onClick={editData}
              className="text-center mb-3 hover:text-[#ff7b7b] hover:scale-110 underline underline-offset-10 "
            >
              ویرایش اطلاعات!
            </p>
          </div>
          <Input
            name="otp"
            description="کد ارسال شده به ایمیل خود رو وارد کنید."
            id="1"
            label=""
            placeholder="23453"
            onChange={otpReqHandler}
            type="number"
            divClass="mx-20"
            inpClass="border-gray-500 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5 md:py-4 lg:py-2.5 text-black disabled"
            disabled={false}
          />
          <Button
            divClass="mt-10 relative h-full"
            butClass="bg-white text-[#50A6CD] hover:bg-blue-700 hover:text-white absolute left-1/3 right-1/3 top-0 p-2.5 rounded-2xl disabled:bg-gray-500"
            handler={otpHandler}
            disabled={otpReq.otp === ""}
          >
            تکمیل ثبت‌نام
          </Button>

          <div
            className={`text-center font-bold ${
              otpResult.success ? "text-green-500 scale-125" : "text-red-600"
            }`}
          >
            <p>
              {otpResult.show
                ? otpResult.success
                  ? "ثبت‌نام انجام شد! خوش آمدید ✅"
                  : "⛔"
                : null}
            </p>
            <p>{otpResult.show ? otpResult.message : null}</p>
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <>
        <div className="col-span-12 lg:hidden mt-5 border-t-2 h-">
          <p
            onClick={editData}
            className="text-center text-[#50A6CD] my-3 hover:text-[#ff7b7b] hover:scale-110 text-2xl underline-offset-10 underline"
          >
            ویرایش اطلاعات!
          </p>
        </div>
        <Input
          name="otp"
          description="کد ارسال شده به ایمیل خود رو وارد کنید."
          id="1"
          label=""
          placeholder="23453"
          onChange={otpReqHandler}
          type="number"
          divClass="col-span-12 lg:hidden mx-7 mt-5"
          inpClass="border-gray-500 border-1 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5 md:py-4 disabled:bg-[#c3c3c3]"
          disabled={false}
        />

        <div
          className={`col-span-12 lg:hidden text-center font-bold ${
            otpResult.success ? "text-green-500 scale-125" : "text-red-600"
          }`}
        >
          <p>
            {otpResult.show
              ? otpResult.success
                ? "ثبت‌نام انجام شد! خوش آمدید ✅"
                : "⛔"
              : null}
          </p>
          <p>{otpResult.show ? otpResult.message : null}</p>
        </div>

        <Button
          divClass="my-10 relative h-10 col-span-12 lg:hidden"
          butClass="bg-[#50A6CD] hover:bg-blue-700 hover:bg-blue-700 text-white absolute left-1/4 right-1/4 top-0 p-2.5 rounded-2xl disabled:bg-gray-500"
          handler={otpHandler}
          disabled={otpReq.otp === ""}
        >
          تکمیل ثبت‌نام
        </Button>
      </>
    );
  }
}

function Welcome() {
  return (
    <div className="h-full flex flex-col justify-center items-center p-6 md:p-8 lg:p-12 space-y-8 md:space-y-12">
      {/* Welcome Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
          خوش آمدید! 🎉
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-white mx-auto rounded-full opacity-80"></div>
      </div>

      {/* Welcome Message */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 shadow-xl">
          <p className="text-base md:text-lg leading-relaxed text-white/90 text-center">
            بازگشت دوباره شما را خوش‌آمد می‌گوییم. بسیار مفتخریم که در سامانه
            <span className="font-semibold text-cyan-200 mx-2">Nit Course</span>
            در خدمت شما و امر آموزش کشور هستیم. امیدواریم از آموزش خودتون لذت
            ببرید! 🔥
          </p>
        </div>
      </div>

      {/* Login Link */}
      <div className="w-full max-w-md mx-auto">
        <Link to="/login" className="block group">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 rounded-2xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/30 backdrop-blur-sm">
            <div className="space-y-2">
              <p className="text-white font-semibold text-lg">
                حساب کاربری دارید؟
              </p>
              <p className="text-white/80 text-sm">وارد حساب خود شوید</p>
              <div className="flex justify-center mt-3">
                <svg
                  className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-8 right-8 opacity-20 pointer-events-none">
        <div className="w-20 h-20 bg-white rounded-full blur-xl"></div>
      </div>
      <div className="absolute bottom-8 left-8 opacity-20 pointer-events-none">
        <div className="w-16 h-16 bg-cyan-300 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
