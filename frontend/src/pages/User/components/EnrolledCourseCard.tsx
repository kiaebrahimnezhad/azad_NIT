import { Link } from "react-router-dom";
import type { Course } from "../MyCourse";
import { formatDate } from "../../../lib/format";

interface EnrolledCourseCardProps {
  course: Course;
  onDownloadCertificate: (cid: number) => void;
}

function EnrolledCourseCard({ course, onDownloadCertificate }: EnrolledCourseCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {course.name}
          </h3>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-medium">شروع:</span>
            <span className="mr-2">{formatDate(course.start_time, { withTime: true })}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="font-medium">پایان:</span>
            <span className="mr-2">{formatDate(course.end_time, { withTime: true })}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            <span className="font-medium">رشته:</span>
            <span className="mr-2">{course.field1}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            to={`/exam/courseExams/${course.cid}`}
          >
            شرکت در آزمون
          </Link>

          <button
            onClick={() => onDownloadCertificate(course.cid)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            دریافت گواهی
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnrolledCourseCard;
