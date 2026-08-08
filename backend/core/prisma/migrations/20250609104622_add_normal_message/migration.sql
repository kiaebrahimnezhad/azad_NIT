-- CreateTable
CREATE TABLE "Message" (
    "reciver" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("reciver","sender","text")
);
