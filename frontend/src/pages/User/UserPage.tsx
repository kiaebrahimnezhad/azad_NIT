import { useState } from "react";
import UserPanel from "../../components/UserPanel";
import Information from "./Information";
import MyCourse from "./MyCourse";
import MyRequestedCourse from "./MyRequestedCourse";
import CourseReq from "./CourseReq";
import Messages from "./Messages";

function UserPage(){
  const [activePanel, setActivePanel] = useState("information");
  // useEffect
  // حذف شد چون بررسی نقش اصلا لازم نیست و توسط مسیرهای کنترلی بررسی می‌شه 
  return (
    <div className="adminPage flex flex-col w-full">
      <section className="grid grid-cols-12 px-6">
        <UserPanel activePanel={activePanel} setActivePanel={setActivePanel} />
        <div className="content-container lg:col-start-4 col-span-12 lg:col-span-9 ">
          {activePanel === "information" && <Information />}
          {activePanel === "MyCourse" && <MyCourse />}
          {activePanel === "MyRequestedCourse" && <MyRequestedCourse />}
          {activePanel === "RequestCourse" && <CourseReq />}
          {activePanel === "ViewMessages" && <Messages />}
          
        </div>
      </section>
    </div>
  );
};

export default UserPage;
