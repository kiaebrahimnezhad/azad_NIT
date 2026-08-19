// src/pages/Testp/Testp.tsx
import React, { createContext, ReactNode } from "react";
import useSession from "../../hooks/useSession";
import Header from "../../components/Header";
import LoadingSpinner from "../../components/LoadingSpinner";
import CourseReq from "../User/CourseReq";
import Information from "../User/Information";

// دقیقاً همان tuple برگشتی از useSession
function Testp() {
  const [session, setSession] = useSession();

  return (
    <>
      <Header />
      <LoadingSpinner />
      
      <Information />

      <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />

      <CourseReq />

    </>
    
  )
}

export default Testp;
