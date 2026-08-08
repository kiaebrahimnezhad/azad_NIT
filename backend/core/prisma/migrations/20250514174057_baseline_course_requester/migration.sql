-- CreateTable
CREATE TABLE "CourseRequester" (
    "username" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,

    CONSTRAINT "CourseRequester_pkey" PRIMARY KEY ("username","cid")
);

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_cid_fkey" FOREIGN KEY ("cid") REFERENCES "Course"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRequester" ADD CONSTRAINT "CourseRequester_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRequester" ADD CONSTRAINT "CourseRequester_cid_fkey" FOREIGN KEY ("cid") REFERENCES "Course"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;
