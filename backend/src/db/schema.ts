import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	bucket: text('bucket').notNull(),
	key: text('key').notNull(),
	folderId: text('folder_id'),
	thumbnailKey: text('thumbnail_key'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	trashedAt: timestamp('trashed_at'),
});

export const userEncryptionKeys = pgTable('user_encryption_keys', {
	userId: text('user_id').primaryKey(),
	encryptedDek: text('encrypted_dek').notNull(),
	dekIv: text('dek_iv').notNull(),
	dekSalt: text('dek_salt').notNull(),
	kdfAlgorithm: text('kdf_algorithm').notNull().default('argon2id'),
	kdfParams: text('kdf_params').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const folders = pgTable('folders', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	parentId: text('parent_id'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	trashedAt: timestamp('trashed_at'),
});
