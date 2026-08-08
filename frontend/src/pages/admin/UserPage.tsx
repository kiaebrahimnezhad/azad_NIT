import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserPanel from "../../components/UserPanel";
import Information from "../User/Information";
import MyCourse from "../User/MyCourse";
import MyRequestedCourse from "../User/MyRequestedCourse";
import CourseReq from "../User/CourseReq";
import Messages from "../User/Messages";

const UserPage: React.FC = () => {
  const [activePanel, setActivePanel] = useState("information");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isUserLogin") === "") {
      navigate("../login");
    }
  }, [navigate]);

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
