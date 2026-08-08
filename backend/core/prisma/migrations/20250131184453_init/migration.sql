-- CreateTable
CREATE TABLE "User" (
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "father_name" TEXT,
    "field" TEXT NOT NULL,
    "student_id" TEXT,
    "phone" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Field" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Admin" (
    "username" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Owner" (
    "username" TEXT NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Shop" (
    "username" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("username","cid")
);

-- CreateTable
CREATE TABLE "Answer" (
    "username" TEXT NOT NULL,
    "qid" INTEGER NOT NULL,
    "ans" INTEGER NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("username","qid")
);

-- CreateTable
CREATE TABLE "Course" (
    "cid" INTEGER NOT NULL,
    "description" TEXT,
    "certificate" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "start_sign_up" TIMESTAMP(3) NOT NULL,
    "end_sign_up" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL,
    "field1" TEXT NOT NULL,
    "field2" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("cid")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "replied_to" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "eid" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "min_score" DOUBLE PRECISION NOT NULL,
    "courseCid" INTEGER NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("eid")
);

-- CreateTable
CREATE TABLE "Message" (
    "reciver" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("reciver","sender","text")
);

-- CreateTable
CREATE TABLE "Question" (
    "qid" INTEGER NOT NULL,
    "quest" TEXT NOT NULL,
    "option1" TEXT NOT NULL,
    "option2" TEXT NOT NULL,
    "option3" TEXT NOT NULL,
    "option4" TEXT NOT NULL,
    "option5" TEXT NOT NULL,
    "ans" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("qid")
);

-- CreateTable
CREATE TABLE "Student" (
    "username" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("username","cid")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "username" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("username","cid")
);

-- CreateTable
CREATE TABLE "Time" (
    "cid" INTEGER NOT NULL,
    "start_time" INTEGER NOT NULL,
    "end_time" INTEGER NOT NULL,
    "day" TEXT NOT NULL,

    CONSTRAINT "Time_pkey" PRIMARY KEY ("cid","start_time","day")
);

-- CreateTable
CREATE TABLE "Score" (
    "username" TEXT NOT NULL,
    "eid" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("username","eid")
);
