import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	bucket: text('bucket').notNull(),
	key: text('key').notNull(),
	folderId: text('folder_id'),
	createdAt: integer('created_at').notNull(),
});

export const folders = pgTable('folders', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	parentId: text('parent_id'),
	createdAt: integer('created_at').notNull(),
});
