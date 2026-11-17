-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_clubId_fkey";

-- DropForeignKey
ALTER TABLE "ClubOwner" DROP CONSTRAINT "ClubOwner_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_clubId_fkey";

-- DropForeignKey
ALTER TABLE "SlotDuration" DROP CONSTRAINT "SlotDuration_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_clubId_fkey";

-- CreateIndex
CREATE INDEX "Booking_clubId_idx" ON "Booking"("clubId");

-- CreateIndex
CREATE INDEX "Booking_clubId_date_idx" ON "Booking"("clubId", "date");

-- CreateIndex
CREATE INDEX "ClubOwner_clubId_idx" ON "ClubOwner"("clubId");

-- CreateIndex
CREATE INDEX "Invoice_clubId_idx" ON "Invoice"("clubId");

-- CreateIndex
CREATE INDEX "OperatingHours_clubId_idx" ON "OperatingHours"("clubId");

-- CreateIndex
CREATE INDEX "Product_clubId_idx" ON "Product"("clubId");

-- CreateIndex
CREATE INDEX "SlotDuration_clubId_idx" ON "SlotDuration"("clubId");

-- CreateIndex
CREATE INDEX "Table_clubId_idx" ON "Table"("clubId");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotDuration" ADD CONSTRAINT "SlotDuration_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingHours" ADD CONSTRAINT "OperatingHours_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubOwner" ADD CONSTRAINT "ClubOwner_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
