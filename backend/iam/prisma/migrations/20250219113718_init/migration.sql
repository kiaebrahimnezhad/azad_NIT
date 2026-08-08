-- CreateTable
CREATE TABLE "Otp" (
    "mail" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("mail")
);
