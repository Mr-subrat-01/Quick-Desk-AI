-- CreateIndex
CREATE INDEX "audit_logs_ticketId_idx" ON "audit_logs"("ticketId");

-- CreateIndex
CREATE INDEX "tickets_employeeId_createdAt_idx" ON "tickets"("employeeId", "createdAt" DESC);
