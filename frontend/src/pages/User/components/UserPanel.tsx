import React from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from "../../../hooks/useWindowSize";
import { useAuth } from "../../../context/AuthContext";

interface UserPanelProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

interface MenuItem {
  key: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    key: "home",
    label: "خانه",
    path: "/",
    icon: (
      <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 1.293a1 1 0 00-1.414 0L2 8.586V17a1 1 0 001 1h4a1 1 0 001-1v-4h4v4a1 1 0 001 1h4a1 1 0 001-1V8.586l-7.293-7.293z" />
      </svg>
    ),
  },
  {
    key: "information",
    label: "اطلاعات کاربری",
    // path: "/user/information",
    icon: (
      <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3z" />
        <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
      </svg>
    ),
  },
  {
    key: "MyCourse",
    label: "دوره های ثبت نامی",
    // path: "/user/MyCourse",
    icon: (
      <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    key: "MyRequestedCourse",
    label: "دوره های من",
    // path: "/user/MyRequestedCourse",
    icon: (
      <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    key: "RequestCourse",
    label: "درخواست دوره جدید",
    path: "/user/RequestCourse",
    icon: (
      <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    key: "ViewMessages",
    label: "مشاهده پیامها",
    path: "/user/ViewMessages",
    icon: (
      <svg className="w-5 h-5 ml-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
      </svg>
    ),
  },
];

// UserPanelProps
function UserPanel({ activePanel, setActivePanel }: UserPanelProps){
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const { userName, logout } = useAuth();
  // احراز هویت اولیه و دریافت یوزرنیم لازم نیست
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  const renderMenuItem = (item: MenuItem, isActive: boolean, onClick: () => void): React.ReactElement => {
    const isMobile = width < 1024;

    const baseClasses = `
      group relative flex items-center px-4 py-3 text-sm font-medium rounded-lg
      transition-all duration-200 ease-in-out cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${isMobile ? "mb-2" : "mb-1"}
    `;

    const activeClasses = isActive
      ? `bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-[1.02]
         ${!isMobile ? "border-r-4 border-blue-300" : ""}`
      : `text-gray-300 hover:bg-blue-600/20 hover:text-white hover:scale-[1.01]
         hover:shadow-md active:scale-[0.98]`;

    return (
      <li key={item.key} className="relative">
        <div
          className={`${baseClasses} ${activeClasses}`}
          onClick={onClick}
          role="menuitem"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, onClick)}
          aria-current={isActive ? "page" : undefined}
        >
          <div className="flex items-center w-full">
            <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
              {item.icon}
            </span>
            <span className="flex-1 text-right">{item.label}</span>
            {isActive && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-300 rounded-r-full"></div>
            )}
          </div>
          <div className="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>
      </li>
    );
  };

  const containerClasses =
    width >= 1024
      ? "col-span-3 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 shadow-2xl h-screen sticky top-0 right-0 "
      : "col-span-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl mx-2 md:mx-4 ";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex gap-2 items-center">
            <h2 className="text-lg font-bold text-white">پنل کاربری</h2>
            <p className="text-xs text-gray-400">{userName}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4" role="navigation" aria-label="منوی پنل کاربری">
        <ul role="menu" className="space-y-1">
          {menuItems.map((item) =>
            renderMenuItem(
              item,
              activePanel === item.key,
              () => {
                if (item.key === "home" && item.path) {
                  navigate(item.path);
                } else {
                  setActivePanel(item.key);
                }
              }
            )
          )}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <button
          className="relative w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300
                             rounded-lg transition-all duration-200 ease-in-out
                             hover:bg-red-600/20 hover:text-red-400 hover:scale-[1.01]
                             focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                             active:scale-[0.98] group"
          onClick={logout}
          role="menuitem"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, logout)}
        >
          <svg
            className="w-5 h-5 ml-3 transition-transform duration-200 group-hover:scale-110"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1 text-right">خروج از حساب کاربری</span>
          <div className="absolute inset-0 bg-red-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>
    </div>
  );
};

export default UserPanel;
