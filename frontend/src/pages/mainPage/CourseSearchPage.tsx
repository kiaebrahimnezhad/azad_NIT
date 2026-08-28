import { useCallback, useEffect, useRef, useState } from "react";
import { coreApi } from "../../lib/api";
import Footer from "../../components/common/Footer";
import pentagonImg from "../../assets/images/pentagon.jpg";
import Header from "../../components/common/Header";
import type { Course, CourseSearchRequest, CourseSearchResponse } from "../../types/publicTypes";
import generalIcon from "../../assets/images/general.jpg";
import electronicsIcon from "../../assets/images/electronics.png";
import mathIcon from "../../assets/images/math.png";
import mechanicalIcon from "../../assets/images/mechanical.PNG";
import civilIcon from "../../assets/images/civil.PNG";
import industrialIcon from "../../assets/images/industrial.PNG";
import CategoryButton from "./components/CategoryButton";
import CourseCard from "./components/CourseCard";
import LoadingInformaition from "../../components/ui/LoadingInformaition";
import { COURSE_CATEGORIES, type CourseCategory } from "../../lib/categories";
import Input from "../../components/ui/Input";

function SiteHero(){
  return (
    <>
      {/* Hero */}
      <div className="relative h-85 md:h-100 bg-gradient-to-r from-blue-300 to-blue-800 overflow-hidden">
        <img src={pentagonImg} alt="Header" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center drop-shadow">
            صدها دوره آموزشی در نیت کورس
          </h1>
        </div>
      </div>
    </>
  )

}


function CourseSearchPage() {
  // const navigate = useNavigate();
  const requestController = useRef<AbortController | null>(null); //این متغیر برای مدیریت لغو درخواست‌های جستجو استفاده می‌شود. اگر کاربر سریعاً معیارهای جستجو را تغییر دهد، درخواست قبلی لغو می‌شود تا از بار اضافی روی سرور جلوگیری شود.

  const [courseName, setCourseName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const coursesResRef = useRef<HTMLDivElement | null>(null);


  // آیکون هر رشته؛ چون Record<CourseCategory, string> است، اگر یک رشته در lib/categories.ts
  // اضافه/حذف/تغییر نام شود ولی اینجا آپدیت نشود، TypeScript همین‌جا خطا می‌دهد.
  const icons: Record<CourseCategory, string> = {
    'عمومی': generalIcon,
    'علوم پایه': mathIcon,
    'برق و کامپیوتر': electronicsIcon,
    'مکانیک': mechanicalIcon,
    'عمران و معماری': civilIcon,
    'صنایع و مدیریت': industrialIcon,
  };

  const categories = COURSE_CATEGORIES.map(
    (id) => (
      {id, name: id, icon: icons[id]}
    )
  );

  const searchCourses = useCallback(async () => {
      requestController.current?.abort(); // لغو درخواست قبلی در صورت وجود
      const controller = new AbortController(); // ایجاد یک کنترلر جدید برای درخواست فعلی
      requestController.current = controller; 

      // ایجاد پارامترهای جستجو بر اساس ورودی‌های کاربر  
      const params: CourseSearchRequest = {};
      // اگر نام دوره وارد شده باشد، به پارامترها اضافه می‌کنیم
      if (courseName.trim())  params.course = courseName.trim();
      if (teacherName.trim()) params.teacher = teacherName.trim();
      if (selectedCategory)   params.field = selectedCategory;

      // ارسال درخواست به بک‌اند با استفاده از coreApi و مدیریت پاسخ
      try {
        setLoading(true);
        const res = await coreApi.post<CourseSearchResponse>(
          '/user/search-course',
          params,
          { signal: controller.signal }
        );
        
        if (res.data.success && Array.isArray(res.data.data)) { 
          setCourses(res.data.data);
        } else {  
          setCourses([]);
        }
      } catch (error) {
        // اگر درخواست لغو شده باشد، هیچ کاری انجام نمی‌دهیم
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Course search failed", error);
        setCourses([]);
      } finally {
        // فقط اگر این کنترلر هنوز فعال است، وضعیت بارگذاری را به false تغییر می‌دهیم
        if (requestController.current === controller) {
          setLoading(false);
        }
      }
    }, [courseName, teacherName, selectedCategory]
  );

  useEffect(() => {
    // اجرای جستجوی اولیه هنگام بارگذاری صفحه
    void searchCourses();
    return () => {
      requestController.current?.abort(); // لغو درخواست در صورت خروج از کامپوننت
    };
  }, []);

  const handleCategoryClick = (cat: string) =>
    setSelectedCategory(selectedCategory === cat ? '' : cat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <SiteHero />
      {/* سکشن کلی فیلد و دوره */}
      <section className="container mx-auto px-4 py-8  "> 
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-8 -mt-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Input
              name="courseName"
              label="نام دوره"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              placeholder="نام دوره را وارد کنید..."
              inpClass="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              labelClass="block text-gray-700 font-medium mb-2"
            />
            <Input
              name="teacherName"
              label="نام استاد"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="نام استاد را وارد کنید..."
              inpClass="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              labelClass="block text-gray-700 font-medium mb-2"
            />
          </div>
          {/* دسته بندی */}
          <div className="mb-8">
            <h3 className="text-gray-700 font-medium mb-4">دسته‌بندی دوره</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            { 
              categories.map(
                cat => (
                  <CategoryButton
                    key={cat.id}
                    id={cat.id}
                    name={cat.name}
                    icon={cat.icon}
                    isSelected={selectedCategory === cat.id}
                    onSelect={handleCategoryClick}
                  />
                )
              )
            }
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={async () => {await searchCourses(); coursesResRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });}}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-3 rounded-lg transition disabled:opacity-50 shadow-md"
            >
              {loading ? 'در حال جستجو...' : 'جستجو'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mt-12" ref={coursesResRef}  >
          {loading ? (
            <LoadingInformaition />
          ) : courses.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                نتایج جستجو ({courses.length} دوره)
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                { courses.map(course => (<CourseCard key={course.cid} course={course} />))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">دوره‌ای یافت نشد</h3>
              <p className="text-gray-500">لطفاً معیارهای جستجو را تغییر دهید</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CourseSearchPage;
