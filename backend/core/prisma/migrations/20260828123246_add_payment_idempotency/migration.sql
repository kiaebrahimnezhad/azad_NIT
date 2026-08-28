-- CreateTable
CREATE TABLE "Payment" (
    "authority" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("authority")
);
