import { Route, Routes, useNavigate } from "react-router-dom";
import Testp from "./pages/Testp/Testp";
import MyCourse from "./pages/User/MyCourse";
import Information from "./pages/User/Information";
import CourseReq from "./pages/User/CourseReq";
import CourseSearchPage from "./pages/mainPage/CourseSearchPage";
import CourseDetail from "./pages/mainPage/CourseDetail";
import BasketPage from "./pages/pay/basket";
import Result from "./pages/pay/result";
import AdminPage from "./pages/admin/AdminPage";
import CourseRequests from "./pages/admin/CourseRequests";
import CommentRequests from "./pages/admin/CommentReports";
import ExamDetails from "./pages/mainPage/ExamDetails";
import WatchCourse from "./pages/mainPage/WatchCourses";
import Signin from "./pages/signin/Signin";
import LoginT from "./pages/login/LoginT";
import type { Auth, PublicContext } from "./types/publicTypes";
import axios, { AxiosError } from "axios";
import { useEffect, useState, createContext } from "react";
import MyRequestedCourse from "./pages/User/MyRequestedCourse";
import CreateExam from "./pages/User/CreateExam";
import Owner from "./pages/owner/Owner";
import UserPage from "./pages/admin/UserPage";
import ExamPage from "./pages/exam/ExamPage";
import { QuizProvider } from "./pages/exam/ExamContext";
import { string } from "yup";

export const publicContext = createContext<PublicContext | null>(null);

function App() {
  const [userName, setUserName] = useState<string>("");
  const [isUserLogin, setIsUserLogin] = useState<boolean>(false);
  const [token, setToken] = useState<string>(
    localStorage.getItem("token") || ""
  );
  const [userType, setUserType] = useState<string>("");

  const navigate = useNavigate();

  useEffect(() => {
    if (token == "") {
      // کاربری لاگین نکرده
      console.log("user no log");
    } else {
      console.log("one user log");

      axios
        .get<Auth>("http://localhost:4000/login/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setUserName(res.data.username);
          setUserType(res.data.userType);
          setIsUserLogin(true);
          console.log();
          console.log();
        })
        .catch((err: Error | AxiosError<{ message: string }>) => {
          if (axios.isAxiosError(err)) {
            console.log(err);
            localStorage.removeItem("token");
            navigate("/login");
          }
        });
    }
  }, []);

  return (
    <publicContext.Provider
      value={{
        userName,
        setUserName,
        isUserLogin,
        setIsUserLogin,
        token,
        setToken,
        userType,
        setUserType,
      }}
    >
      <Routes>
        <Route path="/" element={<CourseSearchPage />} />
        <Route path="/login" element={<LoginT />} />
        <Route path="/signin" element={<Signin />} />
        {/* 
     <Route
    path="/user/course"
    element={
      <ProtectedRoute allow={["normal"]}>
        <MyCourse />
      </ProtectedRoute>
    }
  />

     <Route
    path="/user/information"
    element={
      <ProtectedRoute allow={["normal"]}>
        <Information />
      </ProtectedRoute>
    }
  />

     <Route
    path="/user/course_request"
    element={
      <ProtectedRoute allow={["normal"]}>
        <CourseReq />
      </ProtectedRoute>
    }
  />

       <Route
    path="/user/requestedCourse"
    element={
      <ProtectedRoute allow={["normal"]}>
        <MyRequestedCourse />
      </ProtectedRoute>
    }
  />

       <Route
    path="/user/userPage"
    element={
      <ProtectedRoute allow={["normal"]}>
        <UserPage />
      </ProtectedRoute>
    }
  />

       <Route
    path="/user/userPage/examPage/:cid"
    element={
      <ProtectedRoute allow={["normal"]}>
        <ExamPage />
      </ProtectedRoute>
    }
  /> */}
        <Route path="/user/course" element={<MyCourse />} />
        <Route path="/user/information" element={<Information />} />
        <Route path="/user/course_request" element={<CourseReq />} />
        <Route path="/user/requestedCourse" element={<MyRequestedCourse />} />
        <Route path="/user/userPage" element={<UserPage />} />
        <Route path="/user/userPage/examPage/:cid" element={<ExamPage />} />

        <Route path="/course/:cid" element={<CourseDetail />} />{" "}
        <Route path="/createxam/:cid" element={<CreateExam />} />{" "}
        <Route path="/exam/:eid" element={<ExamDetails />} />{" "}
        <Route path="/pay/basket" element={<BasketPage />} />
        <Route path="/result" element={<Result />} />
        {/*         
 <Route
    path="/admin/adminPage"
    element={
      <ProtectedRoute allow={["admin"]}>
        <AdminPage />
      </ProtectedRoute>
    }
  />
   <Route
    path="/admin/courseRequests"
    element={
      <ProtectedRoute allow={["admin"]}>
        <CourseRequests />
      </ProtectedRoute>
    }
  />
   <Route
    path="/admin/CommentRequests"
    element={
      <ProtectedRoute allow={["admin"]}>
        <CommentRequests />
      </ProtectedRoute>
    }
  /> */}
        <Route path="/admin/adminPage" element={<AdminPage />} />
        <Route path="/admin/courseRequests" element={<CourseRequests />} />
        <Route path="/admin/CommentRequests" element={<CommentRequests />} />
        {/* <Route
    path="/owner"
    element={
      <ProtectedRoute allow={["owner"]}>
        <Owner />
      </ProtectedRoute>
    }
  /> */}
        <Route path="/owner" element={<Owner />} />
        <Route path="/watchCourse/:cid" element={<WatchCourse />} />{" "}
        <Route path="/test" element={<Testp />} />
      </Routes>
    </publicContext.Provider>
  );
}

export default App;
