// src/pages/pay/Basket.tsx
import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import { coreApi, userSafeErrorMessage } from '../../lib/api';
import BasketCourseCard from './components/BasketCourseCard';

export interface Course {
  cid: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  end_sign_up: string;
  price: number;
  field1: string;
  field2?: string | null;
  image: string | null;
}

interface BasketResponse {
  courses: Course[];
  totalPrice: number;
}

interface ActionResponse {
  success: boolean;
  message: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  free?: boolean;
  message?: string;
}

function Basket() {
  const [courses, setCourses]       = useState<Course[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading]       = useState<boolean>(true);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [error, setError]           = useState<string>('');
  // اینجا Toast State رو اضافه می‌کنیم
  const [toast, setToast]           = useState<{ ok: boolean; text: string } | null>(null);

  const navigate = useNavigate();

  // دریافت سبد خرید
  const fetchBasket = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await coreApi.get<BasketResponse>('/payment/get-basket');
      setCourses(data.courses);
      setTotalPrice(data.totalPrice);
    } catch (e) {
      setError(userSafeErrorMessage(e, 'خطا در دریافت سبد خرید'));
    } finally {
      setLoading(false);
    }
  }, []);

  // حذف دوره از سبد
  const removeCourse = async (cid: number) => {
    try {
      const { data } = await coreApi.delete<ActionResponse>('/payment/delete', { data: { cid } });
      if (data.success) {
        await fetchBasket();
        setToast({ ok: true, text: '✅ دوره حذف شد' });
      } else {
        setToast({ ok: false, text: data.message || 'حذف ناموفق بود' });
      }
    } catch (e) {
      setToast({ ok: false, text: userSafeErrorMessage(e, 'خطا در حذف') });
    } finally {
      setTimeout(() => setToast(null), 2000);
    }
  };

  // پرداخت
  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      const { data } = await coreApi.post<PaymentResponse>('/payment/pay', { totalPrice });
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.success && data.free) {
        // سبد کاملاً رایگان بود؛ نیازی به درگاه پرداخت نبود و مستقیم ثبت‌نام شد
        setToast({ ok: true, text: data.message || '✅ ثبت‌نام رایگان با موفقیت انجام شد' });
        await fetchBasket();
      } else {
        setToast({ ok: false, text: data.message || 'خطا در ایجاد پرداخت' });
      }
    } catch (e) {
      setToast({ ok: false, text: userSafeErrorMessage(e, 'خطا در پرداخت') });
    } finally {
      setPaymentLoading(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  useEffect(() => {
    fetchBasket();
  }, [fetchBasket]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {error ? (
          <div className="bg-red-100 text-red-700 border border-red-400 p-4 rounded text-center">
            {error}
            <div>
              <button
                onClick={() => fetchBasket()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                تلاش دوباره
              </button>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">سبد خرید خالی است</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              بازگشت به صفحهٔ اصلی
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 space-y-6">
            {courses.map(course => (
              <BasketCourseCard key={course.cid} course={course} onRemove={removeCourse} />
            ))}

            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-2xl font-bold">مجموع:</span>
              <span className="text-3xl font-bold text-green-600">
                {totalPrice.toLocaleString('fa-IR')} تومان
              </span>
            </div>

            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className="w-full py-3 mt-4 rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:to-purple-700 disabled:opacity-50"
            >
              {paymentLoading ? 'در حال هدایت…' : '💳 پرداخت'}
            </button>
          </div>
        )}
      </div>

      {/* این بلاک برای نمایش Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg text-white ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Basket;