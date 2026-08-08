
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPanel from "../../components/AdminPanel";
import CourseRequests from "./CourseRequests";
import ExamRequests from "./ExamRequests";
import CommentRequests from "./CommentReports";


const AdminPage: React.FC = () => {
  const [activePanel, setActivePanel] = useState("courseRequests");
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem("isUserLogin") === "") {
      navigate("../login");
    }
  }, [navigate]);

  return (
    <div className="adminPage  flex flex-col w-full">
      <section className="grid grid-cols-12 px-6">
        <AdminPanel activePanel={activePanel} setActivePanel={setActivePanel} />
        {/* می‌توانید محتوای مخصوص   را اینجا اضافه کنید */}
        <div className="content-container lg:col-start-4  col-span-12 lg:col-span-9 ">
          {activePanel === "courseRequests" && <CourseRequests />}
          {activePanel === "examRequests" && <ExamRequests />}
          {activePanel === "comments" && <CommentRequests />}

        </div>

      </section>
    </div>
  )
}

export default AdminPage