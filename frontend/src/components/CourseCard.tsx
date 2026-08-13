import { Link } from "react-router-dom";
import type { Course } from "../types/publicTypes";
import { courseImageUrl, DEFAULT_COURSE_IMAGE } from "../lib/assets";

interface CourseCardProps {
  course: Course;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fa-IR').format(price);

function CourseCard({ course }: CourseCardProps) {
  const teacherList = course.teachers
    .map(t => `${t.user.first_name} ${t.user.last_name}`)
    .join("، ");

  return (
    <Link to={`/course/${course.cid}`}>
      <div className="course-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
        <div className="h-48 bg-gray-200 overflow-hidden">
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
          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
            {course.name}
          </h3>
          <div className="text-sm text-gray-600 mb-3">
            <div>{course.field1}{course.field2 ? ` - ${course.field2}` : ''}</div>
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
}

export default CourseCard;