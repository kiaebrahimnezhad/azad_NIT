import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";



function Header() {
  const { userName, isUserLogin, userType, authStatus } = useAuth();
  const location = useLocation();

  const dashboardPath =
    userType === "admin" ? "/admin/adminPage" :
    userType === "owner" ? "/owner" :
    "/user/userPage";

  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-white/40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* لوگو / نام سایت */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l8 4-8 4-8-4 8-4zm0 6l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                نیت کورس
              </span>
            </div>

            {/* بخش ورود/سلام کاربر */}
            {authStatus === "loading" ? (
              <div className="w-28 h-9 rounded-xl bg-gray-200 animate-pulse" />
            ) : isUserLogin ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 text-sm font-medium">
                    سلام {userName}
                  </span>
                </div>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-md transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12h13m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  پنل کاربری
                </Link>
              </div>
            ) : (
              <Link to="/login" state={{ from: location.pathname }}>
                <p
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2 rounded-xl shadow-md transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M15 12H3m0 0l4-4M3 12l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  ورود / ثبت‌نام 
                </p>
              </Link>
              
            )}
          </div>
        </div>
      </header>
  )
}

export default Header;