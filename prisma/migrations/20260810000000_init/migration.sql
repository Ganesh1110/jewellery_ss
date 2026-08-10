-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `hint` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `handle` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `descriptionHtml` VARCHAR(191) NOT NULL DEFAULT '',
    `image` JSON NULL,
    `seo` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Collection_handle_key`(`handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CollectionItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collectionId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `CollectionItem_collectionId_productId_key`(`collectionId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `handle` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `descriptionHtml` VARCHAR(191) NOT NULL DEFAULT '',
    `vendor` VARCHAR(191) NOT NULL DEFAULT 'Style Statement by Shakthi Atelier',
    `productType` VARCHAR(191) NOT NULL DEFAULT 'Jewelry',
    `tags` JSON NOT NULL,
    `availableForSale` BOOLEAN NOT NULL DEFAULT true,
    `totalInventory` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(12, 2) NOT NULL,
    `compareAtPrice` DECIMAL(12, 2) NULL,
    `currencyCode` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `sku` VARCHAR(191) NULL,
    `featuredImage` JSON NULL,
    `images` JSON NOT NULL,
    `options` JSON NOT NULL,
    `seo` JSON NULL,
    `publishedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Product_handle_key`(`handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Processing',
    `customerName` VARCHAR(191) NOT NULL DEFAULT 'Walk-in Checkout',
    `customerEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `customerPhone` VARCHAR(191) NULL,
    `address` JSON NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shipping` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL,
    `currencyCode` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'COD',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `image` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Cart_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cartId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,

    UNIQUE INDEX `CartItem_cartId_productId_key`(`cartId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Blog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `handle` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Blog_handle_key`(`handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `handle` VARCHAR(191) NOT NULL,
    `blogId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NOT NULL DEFAULT '',
    `contentHtml` VARCHAR(191) NOT NULL DEFAULT '',
    `image` JSON NULL,
    `author` VARCHAR(191) NOT NULL DEFAULT '',
    `publishedAt` DATETIME(3) NOT NULL,
    `seo` JSON NULL,

    UNIQUE INDEX `Article_handle_key`(`handle`),
    UNIQUE INDEX `Article_blogId_handle_key`(`blogId`, `handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CollectionItem` ADD CONSTRAINT `CollectionItem_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CollectionItem` ADD CONSTRAINT `CollectionItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `Cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_blogId_fkey` FOREIGN KEY (`blogId`) REFERENCES `Blog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

