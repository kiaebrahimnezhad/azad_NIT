// src/pages/Pay/Basket.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Course {
  cid: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  end_sign_up: string;
  price: number;
  field1: string;
  field2?: string | null;
}

export default function BasketPage() {
  const [courses, setCourses]       = useState<Course[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading]       = useState<boolean>(true);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [error, setError]           = useState<string>('');
  // اینجا Toast State رو اضافه می‌کنیم
  const [toast, setToast]           = useState<{ ok: boolean; text: string } | null>(null);

  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token');

  // دریافت سبد خرید
  const fetchBasket = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError('ابتدا وارد شوید');
        return;
      }

      const res = await fetch('http://localhost:5000/payment/get-basket', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت سبد خرید');
      const json = await res.json();
      setCourses(json.courses);
      setTotalPrice(json.totalPrice);
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // حذف دوره از سبد
  const removeCourse = async (cid: number) => {
    try {
      const token = getToken();
      if (!token) {
        setToast({ ok:false, text:'ابتدا وارد شوید' });
        return;
      }
      const res = await fetch('http://localhost:5000/payment/delete', {
        method : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cid })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchBasket();
        setToast({ ok:true, text:'✅ دوره حذف شد' });
      } else {
        throw new Error(json.message || 'حذف ناموفق بود');
      }
    } catch (e:any) {
      setToast({ ok:false, text:e.message || 'خطا در حذف' });
    } finally {
      setTimeout(() => setToast(null), 2000);
    }
  };

  // پرداخت
  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      const token = getToken();
      if (!token) {
        setToast({ ok:false, text:'ابتدا وارد شوید' });
        return;
      }
      const res = await fetch('http://localhost:5000/payment/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ totalPrice })
      });
      const json = await res.json();
      if (res.ok && json.paymentUrl) {
        window.location.href = json.paymentUrl;
      } else {
        throw new Error(json.message || 'خطا در ایجاد پرداخت');
      }
    } catch (e:any) {
      setToast({ ok:false, text:e.message || 'خطا در پرداخت' });
    } finally {
      setPaymentLoading(false);
      setTimeout(() => setToast(null), 2000);
    }
  };

  useEffect(() => {
    fetchBasket();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
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
              <div key={course.cid} className="flex justify-between items-start bg-white p-4 border rounded-lg shadow-sm">
                <div>
                  <h3 className="text-xl font-bold mb-2">📚 {course.name}</h3>
                  <p className="text-gray-600 mb-1"><strong>رشته:</strong> {course.field1}{course.field2 ? ` - ${course.field2}` : ''}</p>
                  <p className="text-gray-600 mb-1"><strong>شروع:</strong> {new Date(course.start_time).toLocaleDateString('fa-IR')}</p>
                  <p className="text-gray-600 mb-1"><strong>پایان:</strong> {new Date(course.end_time).toLocaleDateString('fa-IR')}</p>
                  <p className="text-gray-700 font-bold">💰 {course.price.toLocaleString('fa-IR')} تومان</p>
                </div>
                <button
                  onClick={() => removeCourse(course.cid)}
                  className="delete-btn bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
                >
                  🗑️ حذف
                </button>
              </div>
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
    </div>
  );
}
