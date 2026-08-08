import { createContext, useContext, useState, type ChangeEvent, useEffect } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { publicContext } from "../../App";

// نوع برای کانتکست لاگین
interface LoginContextProps {
  isForgotPass: boolean;
  setIsForgotPass: React.Dispatch<React.SetStateAction<boolean>>;
  forgotSetup: () => void;
}

const loginContext = createContext<LoginContextProps | null>(null);

const Login = () => {
  const [isForgotPass, setIsForgotPass] = useState<boolean>(false);
  const { isUserLogin } = useContext(publicContext); // دسترسی به publicContext
  const navigate = useNavigate();

  /* useEffect(() => {
    if (localStorage.getItem("isUserLogin") === "y") {
      navigate("../user/information");
    }
  }, [navigate]); */

  useEffect(() => {
    if (isUserLogin) {
      localStorage.getItem("userType") === "admin" ? navigate("/admin/adminPage") : navigate("/user/information");
    }
  }, [navigate])

  const forgotSetup = () => {
    setIsForgotPass(!isForgotPass);
  };

  return (
    <loginContext.Provider value={{ isForgotPass, setIsForgotPass, forgotSetup }}>
      <section className="grid grid-cols-12 p-10 md:p-20 lg:px-45 bg-[#F7F2EF] h-dvh ">
        <div className="col-span-12 lg:col-span-6 bg-[#ffffff] rounded-4xl border-[#14B3ED] lg:rounded-l-none">
          {isForgotPass ? <ForgotForm /> : <LoginForm />}
        </div>
        <div className="hidden lg:block lg:col-span-6 bg-[#50A6CD] py-18 px-13 rounded-4xl lg:rounded-r-none">
          <Welcome />
        </div>
      </section>
    </loginContext.Provider>
  );
};

function Welcome() {
  const context = useContext(loginContext);
  if (!context) {
    return null; // اگر کانتکست null باشد، چیزی نمایش داده نمی‌شود
  }
  const { isForgotPass, forgotSetup } = context;

  return (
    <div className="h-full text-center text-white relative">
      <div className="absolute top-0 w-full">
        <p className="text-4xl pt-5 font-bold">خوش آمدید!!!</p>
      </div>
      <div className="absolute top-3/9 w-full">
        <p className="text-md text-justify">
          بازگشت دوباره شما را خوش‌آمد می‌گوییم. بسیار مفتخریم که در سامانه Nit Course درخدمت شما و امر آموزش کشور هستیم. امیدواریم از آموزش خودتون لذت ببرید!!!🔥
        </p>
      </div>
      <div className="absolute top-5/9 h-1/6 w-full text-center">
        <Link to="/signin">
          <div className="relative h-full">
            <p className="absolute left-1/4 right-1/4 rounded-4xl text-sm bg-[#67B2D5] w-2/4 p-4 transition delay-200 hover:scale-110 hover:bg-blue-700">
              ثبت‌نام نکرده‌اید!؟<br /> حساب کاربری بسازید!
            </p>
          </div>
        </Link>
      </div>
      <div className="absolute top-7/9 h-1/6 w-full text-center">
        <p
          className="text-md underline underline-offset-10 transition delay-200 hover:text-[#5fffec] hover:scale-115 py-2"
          onClick={forgotSetup}
        >
          {isForgotPass ? "بازگشت به صفحه ورود" : "آیا رمز عبور خود را فراموش کرده‌اید؟"}
        </p>
      </div>
    </div>
  );
}

interface SubmitResult {
  result: string;
  success: boolean;
  show: boolean;
}

function LoginForm() {
  const [userInf, setUserInf] = useState({
    username: "",
    password: "",
  });

  const { setUserName, setIsUserLogin, setToken, setUserType } = useContext(publicContext);
  const [submitResult, setSubmitResult] = useState<SubmitResult>({
    result: "",
    success: false,
    show: false,
  });

  const context = useContext(loginContext);
  if (!context) {
    return null; // اگر کانتکست null باشد، چیزی نمایش داده نمی‌شود
  }
  const { forgotSetup } = context;
  const navigate = useNavigate();

  const userInfHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInf((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  interface LoginResponse {
  token: string;
  userType: string;
  message: string;
}
  const submitHandler = async () => {
    try {
      const response = await axios.post<LoginResponse>("http://localhost:4000/login", userInf);
      console.log(typeof(response));
      localStorage.setItem("userName", userInf.username);
      setUserName(userInf.username);
      localStorage.setItem("isUserLogin", "y");
      setIsUserLogin(true);
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
      localStorage.setItem("userType", response.data.userType);
      setUserType(response.data.userType);

      setSubmitResult({
        result: response.data.message,
        show: true,
        success: true,
      });

      setTimeout(() => {
        if (response.data.userType === "admin") {
          navigate("/admin/adminPage");
        } else {
          navigate("/user/course");
        }
      }, 1000);
    } catch (err: any) {
      setSubmitResult({
        result: err.response?.data?.message || "خطایی رخ داد",
        show: true,
        success: false,
      });
    }
  };

  return (
    <div className="grid grid-cols-12 h-full">
      <div className="text-center p-8 lg:p-12 col-span-12">
        <p className="font-bold text-2xl lg:text-4xl">ورود</p>
      </div>
      <Input
        name="username"
        type="text"
        label="نام کاربری"
        pHolder="ali"
        id="1"
        onChange={userInfHandler}
        inpClass="border-gray-500 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5"
        divClass="col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15"
        disabled={false}
        description="لطفا نام‌کاربری خود را وارد کنید."
      />
      <Input
        name="password"
        type="password"
        label="رمز عبور"
        pHolder="123"
        description="لطفا رمز عبور خود را انتخاب نمایید."
        id="2"
        onChange={userInfHandler}
        inpClass="border-gray-500 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5"
        divClass="col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15"
        disabled={false}
      />
      
      <div
        className={`col-span-12 text-center font-bold ${submitResult.success ? "text-green-500 scale-125" : "text-red-600"
          }`}
      >

        <p>{submitResult.show ? (submitResult.success ? "موفقیت ✅🗝️🔓" : "⛔") : null}</p>
        <p>{submitResult.show ? submitResult.result : null}</p>
      </div>

      <Button
        handler={submitHandler}
        divClass="col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15"
        butClass="bg-[#50A6CD] rounded-2xl w-full my-3 py-3 px-5 text-white"
        disabled={false}
      >ورود</Button>

      <div className="lg:hidden col-span-12 pt-5 mx-5 md:mx-10 lg:mx-15 text-center">
                <p className='text-[#50A6CD] transition delay-200 hover:scale-110 hover:text-blue-700 text-md' onClick={forgotSetup} >رمز عبور خود را فراموش کرده‌اید؟</p>
      </div>
            
      <div className="lg:hidden col-span-12 mx-5 md:mx-10  text-center">
                <Link to='/signin'>
                    <p className="text-[#50A6CD]  hover:text-blue-700 text-md transition delay-200 hover:scale-110">ثبت‌نام نکرده‌اید!؟ حساب کاربری بسازید!</p>
                </Link>
      </div>


    </div>
  );
}

// تعریف کامپوننت ForgotForm
function ForgotForm() {
  return (
    <div className="grid grid-cols-12 h-full">
      <div className="text-center p-8 lg:p-12 col-span-12">
        <p className="font-bold text-2xl lg:text-4xl">بازیابی رمز عبور</p>
      </div>
      <Input
        name="email"
        type="email"
        label="ایمیل"
        pHolder="example@example.com"
        id="3"
        onChange={() => { }}
        inpClass="border-gray-500 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5"
        divClass="col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15"
        disabled={false}
        description="لطفا ایمیل خود را وارد کنید."
      />
      <div className="col-span-12 mx-5 md:mx-10 md:mb-10 lg:mx-15">
        <Button
          divClass="relative h-full py-3 px-5"
          butClass="absolute left-1/3 right-1/3 top-0"
          handler={() => { }}
          disabled={false}
        >
          ارسال لینک بازیابی
        </Button>
      </div>
    </div>
  );
}

export default Login;