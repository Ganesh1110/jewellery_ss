-- CreateIndex
-- Supports paginated product listings ordered by createdAt (all filtered by
-- deletedAt IS NULL). Avoids a filesort on the listing query, which on MySQL
-- with prepared statements and wide TEXT/JSON columns can exhaust the sort buffer.
CREATE INDEX `Product_deletedAt_createdAt_idx` ON `Product`(`deletedAt`, `createdAt`);
