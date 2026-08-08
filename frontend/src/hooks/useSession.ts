import { useState, ChangeEvent } from "react";

export interface Session {
  day: string | null;
  start_time: string | null;
  end_time: string | null;
}

// ← این تابع حالا دقیقاً همین نوع را برمی‌گرداند
function useSession(): [
  Session,
  (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
] {
  const [session, setSes] = useState<Session>({
    day: null,
    start_time: null,
    end_time: null,
  });

  const setSession = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setSes((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return [session, setSession];
}

export default useSession;
