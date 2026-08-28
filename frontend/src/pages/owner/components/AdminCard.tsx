import type { AdminItem } from "../Owner";
import styles from "./AdminCard.module.css";

interface AdminCardProps {
  admin: AdminItem;
  removing: boolean;
  onRemove: (username: string) => void;
}

function AdminCard({ admin, removing, onRemove }: AdminCardProps) {
  return (
    <div className={`${styles.gradientBorder} ${styles.cardHover} rounded-2xl`}>
      <div className={`${styles.gradientBorderInner} p-8 rounded-[14px]`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {admin.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="mr-4">
              <h3 className="font-bold text-gray-800 text-lg">{admin.username}</h3>
              <p className="text-sm text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                ادمین سیستم
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            <svg className="w-4 h-4 ml-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {admin.messageNumber} پیام
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onRemove(admin.username)}
            disabled={removing}
            className="flex-1 bg-red-50 text-red-600 py-3 px-4 rounded-xl hover:bg-red-100 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            {removing ? (
              <span className="inline-block w-4 h-4 border-2 rounded-full border-red-600/40 border-t-transparent animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                حذف ادمین
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminCard;
