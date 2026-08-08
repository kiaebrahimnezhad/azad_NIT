-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_cid_fkey" FOREIGN KEY ("cid") REFERENCES "Course"("cid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
