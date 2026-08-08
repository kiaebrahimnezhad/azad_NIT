-- CreateTable
CREATE TABLE "Certificate" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "eid" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_username_eid_key" ON "Certificate"("username", "eid");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eid_fkey" FOREIGN KEY ("eid") REFERENCES "Exam"("eid") ON DELETE RESTRICT ON UPDATE CASCADE;
