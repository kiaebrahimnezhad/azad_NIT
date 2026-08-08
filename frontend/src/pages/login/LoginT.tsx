import React, { createContext, useContext, useEffect, useState } from "react";
import type { LoginContext, UserInfo, UserInfoForgot } from "./loginTypes";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/Input";
import type { LoginResponse, otpResponse, SampleFormResult } from "../../types/publicTypes";
import Button from "../../components/Button";
import { publicContext } from "../../App";
import axios from "axios";

const loginContext = createContext<LoginContext | null>(null);

/* ---------------- Toast ---------------- */
type ToastType = "success" | "error" | "info";
interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}
const Toast: React.FC<{ toast: ToastState }> = ({ toast }) => {
  if (!toast.show) return null;
  const color =
    toast.type === "success"
      ? "border-green-500 bg-green-50 text-green-700"
      : toast.type === "error"
      ? "border-red-500 bg-red-50 text-red-700"
      : "border-blue-500 bg-blue-50 text-blue-700";
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`rounded-2xl shadow-2xl px-5 py-4 border-r-4 ${color} glass-toast`}>
        <div className="flex items-center gap-3">
          {toast.type === "success" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.type === "info" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>
    </div>
  );
};
/* -------------------------------------- */

function LoginT() {
  const navigate = useNavigate();
  const [isForgotPass, setIsForgotPass] = useState<boolean>(false);
  const pContext = useContext(publicContext);

  /* زیباسازی: پس‌زمینه گرادیانی + المان‌های دکوراتیو */
  /* ⬇️ Toast state + helper */
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  // ⬇️ فقط اگر توکن معتبر داشته باشیم، نقش را گرفته و به مسیر صحیح هدایت می‌کنیم
  useEffect(() => {
    const verifyAndRedirect = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // بدون توکن هیچ کاری نکن

      try {
        const res = await fetch("http://localhost:4000/login/user-info", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("unauthorized");
        const data = await res.json(); // { username, userType }

        // همگام‌سازی با context (اختیاری)
        pContext?.setUserName?.(data.username);
        pContext?.setIsUserLogin?.(true);
        pContext?.setUserType?.(data.userType);
        pContext?.setToken?.(token);

        // هدایت براساس نقش
        routeByRole(navigate, data.userType);
      } catch {
        // توکن نامعتبر → پاکسازی و ماندن در همین صفحه
        localStorage.removeItem("token");
        pContext?.setIsUserLogin?.(false);
        pContext?.setUserType?.(undefined as any);
        pContext?.setToken?.("");
      }
    };
    verifyAndRedirect();
  }, [navigate, pContext]);

  return (
    <loginContext.Provider value={{ isForgotPass, setIsForgotPass }}>
      {/* Toast */}
      <Toast toast={toast} />

      <section className="relative grid grid-cols-12 min-h-screen p-6 md:p-10 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
        {/* عناصر دکوراتیو پس‌زمینه */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="relative col-span-12 lg:col-span-6 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
          {isForgotPass ? <ForgotForm onToast={showToast} /> : <LoginForm />}
        </div>

        <div className="hidden lg:block relative lg:col-span-6 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-3xl shadow-2xl">
          <Welcome />
        </div>
      </section>

      {/* استایل‌های کوچک برای جلوه‌ها */}
      <style>{`
        .glass-toast { backdrop-filter: blur(8px); }
      `}</style>
    </loginContext.Provider>
  );
}

export default LoginT;

// ---- Helpers
function routeByRole(navigate: ReturnType<typeof useNavigate>, userType: string) {
  if (userType === "admin") {
    navigate("/admin/adminPage", { replace: true });
  } else if (userType === "owner") {
    navigate("/owner", { replace: true });
  } else {
    navigate("/user/userPage", { replace: true });
  }
}

function LoginForm() {
  const context = useContext(loginContext);
  const pContext = useContext(publicContext);
  const [userInf, setUserInf] = useState<UserInfo>({ username: "", password: "" });
  const [submitResult, setSubmitResult] = useState<SampleFormResult>({
    show: false,
    success: false,
    message: "",
  });
  const navigate = useNavigate();

  const userInfHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInf((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const submitHandler = () => {
    axios
      .post<LoginResponse>("http://localhost:4000/login", userInf)
      .then((response) => {
        const { token, userType } = response.data;

        // ذخیره و کانتکست
        pContext?.setUserName(userInf.username);
        pContext?.setIsUserLogin(true);
        pContext?.setToken(token);
        pContext?.setUserType(userType);
        localStorage.setItem("token", token);

        setSubmitResult({
          message: "ورود شما با موفقیت انجام شد.",
          show: true,
          success: true,
        });

        // هدایت براساس نقش
        setTimeout(() => routeByRole(navigate, userType), 700);
      })
      .catch((err) => {
        setSubmitResult({
          message: err?.response?.data?.message || "خطا در ورود",
          show: true,
          success: false,
        });
      });
  };

  const inp =
    "border-gray-200 bg-white rounded-2xl w-full my-3 py-3 px-5 md:py-4 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all";
  const btn =
    "bg-gradient-to-r from-cyan-600 to-blue-600 text-md transition-all hover:scale-105 hover:shadow-xl rounded-2xl text-white font-bold py-3 disabled:bg-gray-400 disabled:hover:scale-100";

  return (
    <div className="grid grid-cols-12 h-full p-6 md:p-8">
      <div className="text-center pb-2 md:pb-6 col-span-12">
        <p className="font-extrabold text-2xl lg:text-4xl bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
          ورود
        </p>
      </div>

      <Input
        name="username"
        type="text"
        label="نام کاربری"
        pHolder="نام کاربری"
        description=""
        id="1"
        onChange={userInfHandler}
        inpClass={inp}
        divClass="col-span-12 mx-2 md:mx-6 lg:mx-10 "
        disabled={false}
      />

      <Input
        name="password"
        type="password"
        label="رمز عبور"
        pHolder="رمز عبور"
        description=""
        id="2"
        onChange={userInfHandler}
        inpClass={inp}
        divClass="col-span-12 mx-2 md:mx-6 lg:mx-10 "
        disabled={false}
      />

      <div
        className={`col-span-12 text-center font-bold transition-all ${
          submitResult.success ? "text-green-600 scale-110" : "text-red-600"
        }`}
      >
        {submitResult.show && (
          <>
            <p>{submitResult.success ? "موفقیت ✅" : "⛔"}</p>
            <p>{submitResult.message}</p>
          </>
        )}
      </div>

      <div className="col-span-12 mx-2 md:mx-6 lg:mx-10 mt-2 md:mb-8">
        <Button
          divClass={"relative h-full py-3 px-5"}
          butClass={"w-full " + btn}
          handler={submitHandler}
          disabled={userInf.username === "" || userInf.password === ""}
        >
          ورود
        </Button>
      </div>

      <div className="lg:hidden col-span-12 pt-3 mx-2 md:mx-6 lg:mx-10 text-center">
        <p
          className="text-cyan-700 hover:text-blue-700 font-medium transition-all hover:scale-105"
          onClick={() => {
            context?.setIsForgotPass(!context.isForgotPass);
          }}
        >
          رمز عبور خود را فراموش کرده‌اید؟
        </p>
      </div>

      <div className="lg:hidden col-span-12 mx-2 md:mx-6 text-center">
        <Link to="/signin">
          <p className="text-cyan-700 hover:text-blue-700 font-medium transition-all hover:scale-105">
            ثبت‌نام نکرده‌اید؟ حساب کاربری بسازید!
          </p>
        </Link>
      </div>
    </div>
  );
}

function ForgotForm({ onToast }: { onToast?: (message: string, type?: ToastType) => void }) {
  const context = useContext(loginContext);

  const inp =
    "border-gray-200 bg-white rounded-2xl w-full my-2.5 py-3 px-5 md:py-3 shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all";
  const btnPrimary =
    "text-md transition-all hover:scale-105 hover:shadow-xl rounded-2xl text-white font-bold py-2 bg-gradient-to-r from-cyan-600 to-blue-600 disabled:bg-gray-400 disabled:hover:scale-100";
  const btnConfirm =
    "text-md transition-all hover:scale-105 hover:shadow-xl rounded-2xl text-white font-bold py-2 bg-gradient-to-r from-emerald-600 to-green-600 disabled:bg-gray-400 disabled:hover:scale-100";

  const [userInf, setUserInf] = useState<UserInfoForgot>({
    mail: "",
    otp: "",
    newPassword: "",
  });

  const [emailStatus, setEmailStatus] = useState({ input: false, button: false });
  const [otpStatus, setOtpStatus] = useState({ input: true, button: true });

  const [emailRes, setEmailRes] = useState<SampleFormResult>({
    show: false,
    success: false,
    message: "",
  });

  const userInfHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInf((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const letEditEmail = () => {
    setOtpStatus({ input: true, button: true });
    setEmailStatus({ input: false, button: false });
  };

  const emailSubmitHandler = () => {
    const req = { mail: userInf.mail };
    axios
      .post<LoginResponse>("http://localhost:4000/login/forgot-password", req)
      .then(() => {
        setEmailStatus({ input: true, button: true });
        setOtpStatus({ input: false, button: false });
        // ✅ تغییر ۲: Toast موفقیت ارسال OTP
        onToast?.("رمز شناسایی برای شما ایمیل شد", "success");
      })
      .catch((err) => {
        if (err.response?.data?.message === "User not found.") {
          setEmailRes({
            show: true,
            success: false,
            message: "کاربر، با چنین ایمیلی اصلا وجود ندارد!",
          });
        } else {
          setEmailRes({
            message: "مشکلی در تایید یا ارسال کد پیش آمده. دوباره امتحان کنید.",
            show: true,
            success: false,
          });
        }
      });
  };

  const otpSubmitHandler = () => {
    axios
      .post<otpResponse>("http://localhost:4000/login/forgot-password-otp", userInf)
      .then((resp) => {
        // ✅ تغییر ۲: بررسی success در پاسخ
        if ((resp.data as any)?.success === true) {
          onToast?.("رمز عبور با موفقیت به روز شد", "success");
        } else {
          onToast?.("رمز شناسایی صحیح نیست", "error");
        }
      })
      .catch(() => {
        onToast?.("رمز شناسایی صحیح نیست", "error");
      });
  };

  return (
    <section className="grid grid-cols-12 h-full p-6 md:p-8">
      <div className="col-span-12">
        <Input
          name="mail"
          type="email"
          label="ایمیل"
          pHolder="ایمیل"
          description=""
          id="1"
          onChange={userInfHandler}
          inpClass={inp}
          divClass="col-span-12 mx-2 md:mx-6 lg:mx-10"
          disabled={emailStatus.input}
        />

        <Button
          divClass="mx-2 md:mx-6 lg:mx-10 relative h-12"
          butClass={"w-full md:w-1/3 h-full mx-auto " + btnPrimary}
          disabled={emailStatus.button || userInf.mail === ""}
          handler={emailSubmitHandler}
        >
          تایید ایمیل
        </Button>

        {emailStatus.input ? (
          <p className="pt-3 text-md text-center">
            <span
              onClick={letEditEmail}
              className="underline underline-offset-8 text-cyan-700 hover:text-blue-700 transition-all hover:scale-105 cursor-pointer mr-2"
            >
              ویرایش ایمیل ✏️
            </span>
            <span className={`${emailRes.success ? "text-green-600" : "text-red-600"}`}>
              {emailRes.message}
            </span>
          </p>
        ) : null}
      </div>

      <div className="col-span-12 mt-4">
        <Input
          name="otp"
          description="کد ارسال شده به ایمیل خود رو وارد کنید."
          id="2"
          label="کد تایید"
          pHolder="23453"
          onChange={userInfHandler}
          type="number"
          divClass="mx-2 md:mx-6 lg:mx-10"
          inpClass={inp + " text-center"}
          disabled={otpStatus.input}
        />

        <Input
          name="newPassword"
          description="رمز عبور جدید خود را انتخاب کنید"
          id="3"
          label="رمز عبور جدید"
          pHolder="رمز عبور جدید"
          onChange={userInfHandler}
          type="password"
          divClass="col-span-12 mx-2 md:mx-6 lg:mx-10 "
          inpClass={inp}
          disabled={otpStatus.input}
        />

        <Button
          divClass="mx-2 md:mx-6 lg:mx-10 relative mt-2"
          butClass={" w-full md:w-2/5 mx-auto " + btnConfirm}
          disabled={otpStatus.button || userInf.otp === "" || userInf.newPassword === ""}
          handler={otpSubmitHandler}
        >
          تایید
        </Button>
      </div>

      <div className="lg:hidden col-span-12 pt-5 mx-2 md:mx-6 lg:mx-10 text-center">
        <p
          className="text-cyan-700 hover:text-blue-700 font-medium transition-all hover:scale-105 cursor-pointer"
          onClick={() => {
            context?.setIsForgotPass(!context.isForgotPass);
          }}
        >
          بازگشت به صفحه ورود
        </p>
      </div>
    </section>
  );
}

function Welcome() {
  const context = useContext(loginContext);
  return (
    <div className="h-full flex flex-col justify-center items-center text-white p-8 space-y-10 relative">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
          خوش آمدید! <span className="opacity-90">🎉</span>
        </h1>
        <div className="w-24 h-1 bg-white/70 mx-auto rounded-full"></div>
      </div>

      <div className="max-w-xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 shadow-xl">
          <p className="text-base md:text-lg leading-relaxed text-gray-100">
            بازگشت دوباره شما را خوش‌آمد می‌گوییم. بسیار مفتخریم که در سامانه
            <span className="font-semibold text-yellow-200 mx-2">Nit Course</span>
            در خدمت شما هستیم. امیدواریم از آموزش خودتون لذت ببرید! 🔥
          </p>
        </div>
      </div>

      <div className="flex flex-col space-y-6 w-full max-w-md mx-auto">
        <Link to="/signin" className="group">
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/20">
            <div className="space-y-1">
              <p className="text-lg font-semibold">ثبت‌نام نکرده‌اید؟</p>
              <p className="text-sm opacity-90">حساب کاربری بسازید!</p>
            </div>
          </div>
        </Link>

        <div className="text-center">
          <button
            className="text-cyan-200 hover:text-white transition-all duration-300 transform hover:scale-105 underline underline-offset-4"
            onClick={() => {
              context?.setIsForgotPass(!context.isForgotPass);
            }}
          >
            {context?.isForgotPass ? "بازگشت به صفحه ورود" : "آیا رمز عبور خود را فراموش کرده‌اید؟"}
          </button>
        </div>
      </div>

      {/* تزیینات کوچک */}
      <div className="absolute top-6 right-6 opacity-20">
        <div className="w-24 h-24 bg-white rounded-full blur-2xl"></div>
      </div>
      <div className="absolute bottom-6 left-6 opacity-20">
        <div className="w-20 h-20 bg-white rounded-full blur-2xl"></div>
      </div>
    </div>
  );
}
