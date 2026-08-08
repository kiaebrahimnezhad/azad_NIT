import { useContext } from "react";
import { publicContext } from "../App";
import logo from '../assets/svgs/Hamburger_icon.svg.png';
import { useNavigate } from "react-router-dom";
import userImage from '../assets/images/Sample_User_Icon.png';

// تایپ‌ها
interface PublicContextType {
  userName: string;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  isUserLogin: boolean;
  setIsUserLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = () => {
  const { userName, setUserName, isUserLogin, setIsUserLogin } = useContext(publicContext) as PublicContextType;
  const navigate = useNavigate();

  // دکمه صفحه ورود در صورت عدم ورود
  const SignLogin = () => (
    <div
      className="flex items-center w-full h-[7vh] bg-[#44a0cb] border-1 hover:shadow-xl hover:scale-102 delay-200 text-white border-black hover:bg-amber-300 hover:text-black rounded-md"
      onClick={() => navigate('/login')}
    >
      <p className='w-full text-center'>ورود / ثبت‌نام</p>
    </div>
  );

  // عکس کاربر
  const UserPersona = () => (
    <div className="flex items-center justify-center h-full">
      <div
        className="border-1 rounded-lg h-[7vh] w-15 bg-amber-500 flex items-center justify-center text-2xl hover:scale-115 hover:shadow-lg"
        onClick={() => { navigate('/user/information'); }}
      >
        <img className="h-full w-full" src={userImage} alt={userName} title={userName} />
      </div>
    </div>
  );

  return (
    <header className='grid grid-cols-12 py-4 px-6 w-full  bg-white z-1'>
      <div className="col-span-8 md:col-span-9 lg:col-span-10 relative border-1 border-gray-300">
        <div className="absolute right-0 top-0 w-12 h-full lg:hidden border-1">
          <img src={logo} alt="menu" title="menu" className="w-full h-full" />
        </div>
        <div className="hidden lg:block h-full">
          <LoptopItems />
        </div>
      </div>
      <div className='col-span-4 md:col-span-3 lg:col-span-2 h-full border-1'>
        {isUserLogin ? <UserPersona /> : <SignLogin />}
      </div>
    </header>
  );
};

// کامپوننت لیست‌های بالای صفحه
const LoptopItems = () => {
  return (
    <ul className="border-1 h-full flex items-center">
      <li className="inline  mx-8 hover:text text-xl hover:text-shadow-lg hover:scale-105">
        دسته بندی ها
      </li>
      <li className="inline  mx-8 hover:text text-xl hover:text-shadow-lg hover:scale-105">
        پیشنهاد دوره
      </li>
      <li className="inline  mx-8 hover:text text-xl hover:text-shadow-lg hover:scale-105">
        درباره ما
      </li>
      <li className="inline  mx-8 hover:text text-xl hover:text-shadow-lg hover:scale-105">
        تماس با ما
      </li>
    </ul>
  );
};

export default Header;
