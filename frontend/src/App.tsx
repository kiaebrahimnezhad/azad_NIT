import { Route, Routes } from "react-router-dom";
import Testp from "./pages/Testp/Testp";
import CourseSearchPage from "./pages/mainPage/CourseSearchPage";
import CourseDetail from "./pages/mainPage/CourseDetail";
import Result from "./pages/pay/result";
import AdminPage from "./pages/admin/AdminPage";
import ExamDetails from "./pages/mainPage/ExamDetails";
import WatchCourse from "./pages/mainPage/WatchCourses";
import Signin from "./pages/signin/Signin";
import Login from "./pages/login/Login";
import CreateExam from "./pages/User/CreateExam";
import Owner from "./pages/owner/Owner";
import UserPage from "./pages/User/UserPage";
import ExamPage from "./pages/exam/ExamPage";
import { QuizProvider } from "./pages/exam/ExamContext";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Basket from "./pages/pay/Basket";

// سازگاری موقت با فایل‌هایی که هنوز publicContext را از App import می‌کنند.
// درست شد باید حذف شود و از AuthContext استفاده شود.
export const publicContext = AuthContext;

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CourseSearchPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/course/:cid" element={<CourseDetail />} />
      {/* مسیرهای محافظت‌شده */}
      {/* تمامی موارد کاربر فعلا در یک صفحه و با پنل جا به جا می‌شود */}
      {/* <Route
        path="/user/course"
        element={<ProtectedRoute allow={["normal"]}><MyCourse /></ProtectedRoute>}
      />
      <Route
        path="/user/information"
        element={<ProtectedRoute allow={["normal"]}><Information /></ProtectedRoute>}
      />
      <Route
        path="/user/course_request"
        element={<ProtectedRoute allow={["normal"]}><CourseReq /></ProtectedRoute>}
      />
      <Route
        path="/user/requestedCourse"
        element={<ProtectedRoute allow={["normal"]}><MyRequestedCourse /></ProtectedRoute>}
      /> */}
      <Route
        path="/user/userPage/"
        element={<ProtectedRoute allow={["normal"]}><UserPage /></ProtectedRoute>}
      />
      <Route
        path="/user/userPage/examPage/:cid"
        element={
          <ProtectedRoute allow={["normal"]}>
            <QuizProvider><ExamPage /></QuizProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/createxam/:cid/:eid?"
        element={<ProtectedRoute allow={["normal"]}><CreateExam /></ProtectedRoute>}
      />
      <Route
        path="/pay/basket"
        element={<ProtectedRoute allow={["normal"]}><Basket /></ProtectedRoute>}
      />
      <Route
        path="/result"
        element={<ProtectedRoute allow={["normal"]}><Result /></ProtectedRoute>}
      />

      {/* delete panel? */}
      <Route
        path="/admin/adminPage"
        element={<ProtectedRoute allow={["admin"]}><AdminPage /></ProtectedRoute>}
      />
      {/* تمامی موارد ادمین فعلا در یک صفحه و با پنل جا به جا می‌شود */}
      {/* <Route
        path="/admin/courseRequests"
        element={<ProtectedRoute allow={["admin"]}><CourseRequests /></ProtectedRoute>}
      />
      <Route
        path="/admin/CommentRequests"
        element={<ProtectedRoute allow={["admin"]}><CommentRequests /></ProtectedRoute>}
      /> */}
      <Route
        path="/exam/:eid"
        element={<ProtectedRoute allow={["admin", "owner"]}><ExamDetails /></ProtectedRoute>}
      />
      <Route
        path="/watchCourse/:cid"
        element={<ProtectedRoute allow={["admin", "owner"]}><WatchCourse /></ProtectedRoute>}
      />
      <Route
        path="/owner"
        element={<ProtectedRoute allow={["owner"]}><Owner /></ProtectedRoute>}
      />

      {/* {import.meta.env.DEV && <Route path="/test" element={<Testp />} />} */}
      <Route path="/test" element={<Testp />} /> 
      <Route path="*" element={<div className="min-h-screen grid place-items-center">صفحه مورد نظر یافت نشد.</div>} />
      
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}