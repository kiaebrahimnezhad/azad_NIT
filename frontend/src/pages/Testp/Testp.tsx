// src/pages/Testp/Testp.tsx
import React, { createContext, ReactNode } from "react";
import useSession from "../../hooks/useSession";
import Header from "../../components/Header";
import LoadingSpinner from "../../components/LoadingSpinner";

// دقیقاً همان tuple برگشتی از useSession
function Testp() {
  const [session, setSession] = useSession();

  return (
    <>
      <Header />
      <LoadingSpinner />
    </>
    
  )
}

export default Testp;
