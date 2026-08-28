
import { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import CourseRequests from "./CourseRequests";
import ExamRequests from "./ExamRequests";
import CommentRequests from "./CommentReports";

function AdminPage(){
  const [activePanel, setActivePanel] = useState("courseRequests");
 // یادآوری آموزشی برای خودم
 // useEffect
 // حذف شد چون بررسی نقش اصلا لازم نیست و توسط مسیرهای کنترلی بررسی می‌شه 
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