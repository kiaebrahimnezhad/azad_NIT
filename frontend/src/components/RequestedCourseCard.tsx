import type { RequestedCourse } from "../pages/User/MyRequestedCourse";
import { courseImageUrl, DEFAULT_COURSE_IMAGE } from "../lib/assets";

interface RequestedCourseCardProps {
  course: RequestedCourse;
  onView: (cid: number) => void;
  onCreateExam: (cid: number) => void;
  onInvalidView: () => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "-";
  }
};

function RequestedCourseCard({ course, onView, onCreateExam, onInvalidView }: RequestedCourseCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="h-40 w-full bg-gray-50 overflow-hidden">
        <img
          src={courseImageUrl(course.image)}
          alt={course.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_COURSE_IMAGE;
          }}
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${course.is_valid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {course.is_valid ? "تأیید شده" : "در انتظار تأیید"}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>

        <div className="space-y-2 mb-5 text-sm text-gray-700">
          <div className="flex items-center">
            <span className="font-medium ml-1">رشته ۱:</span><span>{course.field1}</span>
          </div>
          {course.field2 ? (
            <div className="flex items-center">
              <span className="font-medium ml-1">رشته ۲:</span><span>{course.field2}</span>
            </div>
          ) : null}
          <div className="flex items-center">
            <span className="font-medium ml-1">شروع دوره:</span><span>{formatDate(course.start_time)}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium ml-1">پایان دوره:</span><span>{formatDate(course.end_time)}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium ml-1">شروع ثبت‌نام:</span><span>{formatDate(course.start_sign_up)}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium ml-1">پایان ثبت‌نام:</span><span>{formatDate(course.end_sign_up)}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium ml-1">شهریه:</span>
            <span>{new Intl.NumberFormat("fa-IR").format(course.price)} تومان</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={!course.is_valid}
            onClick={() => (course.is_valid ? onView(course.cid) : onInvalidView())}
            className={`flex-1 text-center py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${course.is_valid
                ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
          >
            مشاهده دوره
          </button>

          <button
            onClick={() => onCreateExam(course.cid)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            افزودن آزمون
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestedCourseCard;
