import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Course {
  cid: number;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  start_sign_up: string;
  end_sign_up: string;
  price: number;
  field1: string;
  field2: string;
  is_valid: boolean;
}

interface TimeSlot {
  day: string;
  start_time: number;
  end_time: number;
}

const formatMinutes = (m: number) =>
  `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, '0')}`;

const toFa = (d: string) => new Date(d).toLocaleDateString('fa-IR');

const imgUrl = (p: string | null) =>
  p
    ? `http://localhost:5000/${p.replace(/\\/g, '/')}`
    : 'http://localhost:5000/uploads/default.jpg';

const WatchCourse: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('ابتدا وارد شوید');
          return;
        }
        const cRes = await fetch('http://localhost:5000/admin/get-course', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ cid: Number(cid) })
        });
        if (!cRes.ok) throw new Error(`خطای سرور (${cRes.status})`);
        const cJson = await cRes.json();
        if (!cJson.course) throw new Error('دوره‌ای یافت نشد.');

        setCourse(cJson.course);
        setTimes(cJson.time ?? []);
        setImage(cJson.image ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطایی رخ داد');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cid]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg shadow">
        {error}
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-gray-100 text-gray-600 p-6 rounded-lg shadow">
        دوره‌ای یافت نشد.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <Header />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          <section className="bg-white shadow-xl rounded-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gray-100 flex items-center justify-center">
                <img
                  src={imgUrl(image)}
                  alt={course.name}
                  className="w-full h-80 md:h-full object-contain p-4"
                  onError={e => { (e.target as HTMLImageElement).src = 'http://localhost:5000/uploads/default.jpg'; }}
                />
              </div>
              <div className="md:w-2/3 p-8 space-y-6">
                <h1 className="text-3xl font-extrabold text-gray-800">{course.name}</h1>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p><strong>رشته:</strong> {course.field1} / {course.field2}</p>
                  <p><strong>قیمت:</strong> {course.price.toLocaleString('fa-IR')} تومان</p>
                  <p><strong>شروع دوره:</strong> {toFa(course.start_time)}</p>
                  <p><strong>پایان دوره:</strong> {toFa(course.end_time)}</p>
                  <p><strong>شروع ثبت‌نام:</strong> {toFa(course.start_sign_up)}</p>
                  <p><strong>پایان ثبت‌نام:</strong> {toFa(course.end_sign_up)}</p>
                </div>
                <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${course.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {course.is_valid ? 'فعال' : 'غیرفعال'}
                </span>
                {!!times.length && (
                  <div className="pt-4">
                    <h2 className="font-bold text-lg mb-3">⏰ زمان برگزاری</h2>
                    <ul className="space-y-2 text-gray-700">
                      {times.map((t, i) => (
                        <li key={i} className="flex items-center">
                          <span className="w-24">{t.day}:</span>
                          <span>{formatMinutes(t.start_time)} – {formatMinutes(t.end_time)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WatchCourse;