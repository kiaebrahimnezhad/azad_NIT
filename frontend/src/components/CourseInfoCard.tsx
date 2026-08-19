import { courseImageUrl, DEFAULT_COURSE_IMAGE } from "../lib/assets";

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

interface CourseInfoCardProps {
  course: Course;
  image: string | null;
  times: TimeSlot[];
  onAddToBasket: () => void;
}

const formatMinutes = (m: number) =>
  `${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`;

const toFa = (d: string) => new Date(d).toLocaleDateString("fa-IR");

function CourseInfoCard({ course, image, times, onAddToBasket }: CourseInfoCardProps) {
  return (
    <section className="bg-white shadow-xl rounded-xl overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3 bg-gray-100 flex items-center justify-center">
          <img
            src={courseImageUrl(image)}
            alt={course.name}
            className="w-full h-80 md:h-full object-contain p-4"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_COURSE_IMAGE;
            }}
          />
        </div>
        <div className="md:w-2/3 p-8 space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-800">{course.name}</h1>
          <p className="text-gray-700 leading-relaxed">{course.description}</p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <p><strong>رشته:</strong> {course.field1} / {course.field2}</p>
            <p><strong>قیمت:</strong> {course.price.toLocaleString("fa-IR")} تومان</p>
            <p><strong>شروع دوره:</strong> {toFa(course.start_time)}</p>
            <p><strong>پایان دوره:</strong> {toFa(course.end_time)}</p>
            <p><strong>شروع ثبت‌نام:</strong> {toFa(course.start_sign_up)}</p>
            <p><strong>پایان ثبت‌نام:</strong> {toFa(course.end_sign_up)}</p>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${course.is_valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {course.is_valid ? "فعال" : "غیرفعال"}
          </span>
          {!!times.length && (
            <div className="pt-4">
              <h2 className="font-bold mb-2">⏰ زمان برگزاری</h2>
              <ul className="space-y-1">
                {times.map((t, i) => (
                  <li key={i} className="text-gray-700">{t.day}: {formatMinutes(t.start_time)} – {formatMinutes(t.end_time)}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:to-blue-800 text-white py-3 rounded-lg shadow-md mt-6"
            onClick={onAddToBasket}
          >
            افزودن به سبد خرید
          </button>
        </div>
      </div>
    </section>
  );
}

export default CourseInfoCard;