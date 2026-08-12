-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `compareAtPrice` DECIMAL(12, 2) NULL,
    `currencyCode` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `stock` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
    `availableForSale` BOOLEAN NOT NULL DEFAULT true,
    `image` JSON NULL,
    `selectedOptions` JSON NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryMovement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variantId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `reference` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: add variantId as NULL first (existing rows are backfilled below,
-- then contracted to NOT NULL at the end of this script).
ALTER TABLE `CartItem` ADD COLUMN `variantId` INTEGER NULL;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `variantId` INTEGER NULL;

-- AlterTable: add deletedAt now; the DROP of `sku` is moved to the very end so the
-- backfill below can still read Product.sku.
ALTER TABLE `Product` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Rework CartItem indexes/FKs: the old unique index (cartId, productId) backs BOTH
-- the productId FK and the cartId FK (cartId is its leftmost column). So we drop
-- both FKs first, drop the unique index, give the productId FK its own standalone
-- index, recreate the productId FK, add the new unique index (cartId, variantId)
-- which can back the cartId FK, then recreate the cartId FK.
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_productId_fkey`;
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_cartId_fkey`;
DROP INDEX `CartItem_cartId_productId_key` ON `CartItem`;
CREATE INDEX `CartItem_productId_idx` ON `CartItem`(`productId`);
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: new unique must exist before the contract step relies on it, and it
-- also backs the recreated cartId FK below.
CREATE UNIQUE INDEX `CartItem_cartId_variantId_key` ON `CartItem`(`cartId`, `variantId`);

-- Recreate the cartId FK (now backed by the new unique index).
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one Default variant per product (reads Product.sku before it is dropped)
INSERT INTO `ProductVariant`
  (`productId`, `title`, `price`, `compareAtPrice`, `currencyCode`, `sku`, `barcode`,
   `stock`, `lowStockThreshold`, `availableForSale`, `selectedOptions`, `position`,
   `createdAt`, `updatedAt`)
SELECT `id`, 'Default Title', `price`, `compareAtPrice`, `currencyCode`, `sku`, NULL,
       `totalInventory`, 5, `availableForSale`, '[]', 0, NOW(3), NOW(3)
FROM `Product`;

-- Point existing rows at their product's default variant
UPDATE `CartItem` SET `variantId` =
  (SELECT `id` FROM `ProductVariant` v WHERE v.`productId` = `CartItem`.`productId`);
UPDATE `OrderItem` SET `variantId` =
  (SELECT `id` FROM `ProductVariant` v WHERE v.`productId` = `OrderItem`.`productId`);

-- Contract: enforce variantId NOT NULL and attach FKs (CartItem CASCADE, OrderItem RESTRICT)
ALTER TABLE `CartItem` MODIFY `variantId` INTEGER NOT NULL;
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_variantId_fkey`
  FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `OrderItem` MODIFY `variantId` INTEGER NOT NULL;
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey`
  FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop Product.sku last (after the backfill has consumed it)
ALTER TABLE `Product` DROP COLUMN `sku`;
