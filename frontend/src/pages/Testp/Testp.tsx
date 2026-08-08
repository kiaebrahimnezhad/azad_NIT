// src/pages/Testp/Testp.tsx
import React, { createContext, ReactNode } from "react";
import useSession from "../../hooks/useSession";

// دقیقاً همان tuple برگشتی از useSession
export type Session = {
  day: string | null;
  start_time: string | null;
  end_time: string | null;
};

type TestContextType = ReturnType<typeof useSession>;

export const testContext = createContext<TestContextType | null>(null);

const Testp: React.FC = () => {
  const sessionTuple = useSession(); // [session: Session, setSession: (...)=>void]

  return (
    <testContext.Provider value={sessionTuple}>
      <section className="grid grid-cols-12 absolute left-0 right-0 top-21">
        {/* اینجا می‌تونی با useContext(testContext) به جلسه‌ها دسترسی پیدا کنی */}
      </section>
    </testContext.Provider>
  );
};

export default Testp;
