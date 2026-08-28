// src/pages/Testp/Testp.tsx
import React, { createContext, ReactNode } from "react";
import useSession from "../../hooks/useSession";
import Header from "../../components/common/Header";
import LoadingInformaition from "../../components/ui/LoadingInformaition";


// دقیقاً همان tuple برگشتی از useSession
function Testp() {
  const [session, setSession] = useSession();

  return (
    <>
      <Header />
      <LoadingInformaition />
      <br /><br />
      <LoadingInformaition message="در حال ارسال..." size="sm" />

    </>
    
  )
}

export default Testp;
