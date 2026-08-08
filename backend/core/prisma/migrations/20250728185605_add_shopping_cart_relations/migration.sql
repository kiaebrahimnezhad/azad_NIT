-- CreateTable
CREATE TABLE "shopping_cart" (
    "username" TEXT NOT NULL,
    "cid" INTEGER NOT NULL,

    CONSTRAINT "shopping_cart_pkey" PRIMARY KEY ("username","cid")
);

-- AddForeignKey
ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_username_fkey" FOREIGN KEY ("username") REFERENCES "User"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_cid_fkey" FOREIGN KEY ("cid") REFERENCES "Course"("cid") ON DELETE CASCADE ON UPDATE CASCADE;
