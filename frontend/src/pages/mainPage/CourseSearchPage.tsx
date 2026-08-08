import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Header image و آیکون‌ها
import headerImg from './header.PNG';
import icon1 from './1.jpg';
import icon2 from './2.PNG';
import icon3 from './3.PNG';
import icon4 from './4.PNG';
import icon5 from './5.PNG';
import icon6 from './6.PNG';
import Footer from '../../components/Footer';

interface Teacher {
  user: {
    first_name: string;
    last_name: string;
  };
}

interface Course {
  cid: number;
  name: string;
  field1: string;
  field2: string;
  price: number;
  image: string | null;
  teachers: Teacher[];
  is_valid: boolean;
}

interface AuthUser {
  username: string;
  userType?: string;
}

const CourseSearchPage: React.FC = () => {
  const [courseName, setCourseName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  // وضعیت کاربر برای نمایش «سلام username»
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
const dashboardPath =
  authUser?.userType === 'admin'
    ? '/admin/adminPage'
    : authUser?.userType === 'owner'
    ? '/owner'
    : '/user/userPage';

  const icons: Record<string,string> = {
    'عمومی': icon1,
    'علوم پایه': icon2,
    'برق و کامپیوتر': icon3,
    'مکانیک': icon4,
    'عمران و معماری': icon5,
    'صنایع و مدیریت': icon6,
  };

  const categories = Object.entries(icons).map(([id, icon]) => ({
    id, name: id, icon
  }));

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(price);

  const searchCourses = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (courseName.trim())  params.course = courseName.trim();
      if (teacherName.trim()) params.teacher = teacherName.trim();
      if (selectedCategory)   params.field = selectedCategory;

      const res = await fetch('http://localhost:5000/user/search-course', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(params)
      });

      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const cleanedCourses: Course[] = result.data.map((c: any) => ({
          cid: c.cid,
          name: c.name,
          field1: c.field1,
          field2: c.field2,
          price: c.price,
          image: c.image ?? null,
          teachers: c.teachers ?? [],
          is_valid: c.is_valid,
        }));
        setCourses(cleanedCourses);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('❌ خطا در جستجو:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // دریافت اطلاعات کاربر برای نمایش «سلام username»
  useEffect(() => {
    const verify = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return; // مهمان، دکمه ورود نمایش داده می‌شود
        const res = await fetch('http://localhost:4000/login/user-info', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return; // توکن نامعتبر، همان ظاهر مهمان
        const data = await res.json();
        if (data?.username) setAuthUser({ username: data.username, userType: data.userType });
      } catch {
        // در هر خطایی، همان حالت مهمان بماند
      }
    };
    verify();
  }, []);

  useEffect(() => {
    searchCourses();
  }, []);

  const handleCategoryClick = (cat: string) =>
    setSelectedCategory(selectedCategory === cat ? '' : cat);

  const handleLoginClick = () =>
    window.location.href = '/login';

  // تبدیل آدرس تصویر بک‌اند به URL قابل استفاده
  const imageUrl = (imagePath: string | null): string => {
    if (!imagePath) return 'http://localhost:5000/uploads/default.jpg';
    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/\/+/g, '/');
    return `http://localhost:5000/${normalizedPath}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header (زیباتر + حالت شیشه‌ای) */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-white/40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* لوگو / نام سایت */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l8 4-8 4-8-4 8-4zm0 6l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                نیت کورس
              </span>
            </div>

            {/* بخش ورود/سلام کاربر */}
            {authUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                    {authUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 text-sm font-medium">
                    سلام {authUser.username}
                  </span>
                </div>
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-md transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12h13m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  پنل کاربری
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLoginClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2 rounded-xl shadow-md transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M15 12H3m0 0l4-4M3 12l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ورود / ثبت‌نام
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-80 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
        <img src={headerImg} alt="Header" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow">
            صدها دوره آموزشی در نیت کورس
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 -mt-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2">نام دوره</label>
              <input
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="نام دوره را وارد کنید..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">نام استاد</label>
              <input
                type="text"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="نام استاد را وارد کنید..."
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-gray-700 font-medium mb-4">دسته‌بندی دوره</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`p-4 rounded-xl border-2 text-center transition ${
                    selectedCategory===cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <img src={cat.icon} alt={cat.name} className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={searchCourses}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-3 rounded-lg transition disabled:opacity-50 shadow-md"
            >
              {loading ? 'در حال جستجو...' : 'جستجو'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
            </div>
          ) : courses.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                نتایج جستجو ({courses.length} دوره)
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map(course => {
                  const teacherList = course.teachers
                    .map(t => `${t.user.first_name} ${t.user.last_name}`)
                    .join('، ');

                  return (
                    <Link to={`/course/${course.cid}`} key={course.cid}>
                      <div className="course-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
                        <div className="h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={imageUrl(course.image)}
                            alt={course.name}
                            className="w-full h-full object-cover"
                            // onError={(e) => {
                            //   (e.target as HTMLImageElement).src = 'http://localhost:5000/uploads/default.jpg';
                            // }}
                          />                      
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
                            {course.name}
                          </h3>
                          <div className="text-sm text-gray-600 mb-3">
                            <div>{course.field1}</div>
                            <div>{course.field2}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-blue-600">
                              {formatPrice(course.price)} تومان
                            </span>
                            <span className="text-gray-700 text-sm px-2 py-1 rounded-full">
                              {teacherList || "استادی تعیین نشده"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">دوره‌ای یافت نشد</h3>
              <p className="text-gray-500">لطفاً معیارهای جستجو را تغییر دهید</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CourseSearchPage;
