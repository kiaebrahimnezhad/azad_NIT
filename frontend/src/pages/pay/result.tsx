// src/pages/Pay/Result.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ResultState {
  success: boolean;
  title:   string;
  message: string;
  details: string;
  refId?:  string;
  authority?: string;
}

const Result: React.FC = () => {
  const [loading, setLoading]     = useState(true);
  const [result,  setResult]      = useState<ResultState | null>(null);
  const [search]                  = useSearchParams();
  const nav                       = useNavigate();

  const token = localStorage.getItem('token');

  /* ------------ پردازش پاسخ زرین‌پال ------------ */
  useEffect(() => {
    const run = async () => {
      try {
        const status    = search.get('Status');
        const authority = search.get('Authority');

        if (status === 'OK' && authority) {
          /* Verify & roll-back */
          const res = await fetch('http://localhost:5000/payment/roll-back', {
            method : 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization : `Bearer ${token || ''}`,
            },
            body: JSON.stringify({ authority })
          });
          const json = await res.json();

          if (res.ok && json.success) {
            setResult({
              success  : true,
              title    : 'پرداخت موفق',
              message  : 'پرداخت شما با موفقیت انجام شد!',
              details  : 'دوره‌ ها به لیست شما اضافه شدند.',
              refId    : json.refId,
              authority
            });
          } else {
            throw new Error(json.message || 'خطا در تأیید پرداخت');
          }
        } else if (status === 'NOK') {
          setResult({
            success:false, title:'پرداخت لغو شد',
            message:'پرداخت توسط شما لغو شد',
            details:'سبد خرید شما تغییر نکرد.'
          });
        } else {
          throw new Error('پرداخت ناموفق بود');
        }
      } catch (e:any) {
        setResult({
          success : false,
          title   : 'خطا',
          message : e.message || 'خطایی رخ داد',
          details : 'لطفاً مجدداً تلاش کنید.'
        });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  /* ------------ UI ------------ */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin"></span>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-indigo-400 to-purple-500">
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 text-center animate-[slideUp_.6s_ease-out]">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center
            {result?.success ? 'bg-green-100' : 'bg-red-100'}">
          <span className="text-5xl">
            {result?.success ? '✅' : '❌'}
          </span>
        </div>

        <h1 className={`text-3xl font-bold mb-4
          ${result?.success ? 'text-green-600' : 'text-red-600'}`}>
          {result?.title}
        </h1>

        <p className="text-xl font-semibold text-gray-700 mb-3">{result?.message}</p>
        <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-line">{result?.details}</p>

        {result?.refId && (
          <div className="mb-6 text-left text-sm bg-gray-50 rounded-xl p-4 border">
            <p><b>کد پیگیری:</b> {result.refId}</p>
            <p><b>Authority:</b> {result.authority}</p>
          </div>
        )}

        <div className="space-y-3">
          {result?.success ? (
            <button
              onClick={() => nav('/')}
              className="w-full py-3 rounded-xl text-white font-bold
              bg-gradient-to-r from-indigo-500 to-purple-600 hover:to-purple-700">
              🏠 رفتن به صفحهٔ اصلی
            </button>
          ) : (
            <>
              <button
                onClick={() => nav('/basket')}
                className="w-full py-3 rounded-xl text-white font-bold bg-red-500/90 hover:bg-red-600">
                🔄 تلاش مجدد / بازگشت به سبد
              </button>
              <button
                onClick={() => nav('/')}
                className="w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold">
                صفحهٔ اصلی
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
