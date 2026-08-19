import type { Course } from "../pages/pay/Basket";
import { courseImageUrl, DEFAULT_COURSE_IMAGE } from "../lib/assets";

interface BasketCourseCardProps {
  course: Course;
  onRemove: (cid: number) => void;
}

function BasketCourseCard({ course, onRemove }: BasketCourseCardProps) {
  return (
    <div className="flex justify-between items-start gap-4 bg-white p-4 border rounded-lg shadow-sm">
      <div className="flex gap-4">
        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
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
        <div>
          <h3 className="text-xl font-bold mb-2">📚 {course.name}</h3>
          <p className="text-gray-600 mb-1">
            <strong>رشته:</strong> {course.field1}{course.field2 ? ` - ${course.field2}` : ""}
          </p>
          <p className="text-gray-600 mb-1">
            <strong>شروع:</strong> {new Date(course.start_time).toLocaleDateString("fa-IR")}
          </p>
          <p className="text-gray-600 mb-1">
            <strong>پایان:</strong> {new Date(course.end_time).toLocaleDateString("fa-IR")}
          </p>
          <p className="text-gray-700 font-bold">💰 {course.price.toLocaleString("fa-IR")} تومان</p>
        </div>
      </div>
      <button
        onClick={() => onRemove(course.cid)}
        className="delete-btn shrink-0 bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
      >
        🗑️ حذف
      </button>
    </div>
  );
}

export default BasketCourseCard;
