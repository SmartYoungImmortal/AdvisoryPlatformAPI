import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

export const chatRooms = pgTable('chat_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatMembers = pgTable(
  'chat_members',
  {
    chatRoomId: uuid('chat_room_id')
      .notNull()
      .references(() => chatRooms.id),
    memberUserId: uuid('member_user_id')
      .notNull()
      .references(() => user.id),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.chatRoomId, table.memberUserId] })],
);

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatRoomId: uuid('chat_room_id')
    .notNull()
    .references(() => chatRooms.id),
  senderUserId: uuid('sender_user_id')
    .notNull()
    .references(() => user.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatFiles = pgTable(
  'chat_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatRoomId: uuid('chat_room_id')
      .notNull()
      .references(() => chatRooms.id),
    senderUserId: uuid('sender_user_id')
      .notNull()
      .references(() => user.id),
    objectKey: varchar('object_key').notNull(),
    originalFileName: varchar('original_file_name').notNull(),
    mimeType: varchar('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'chat_files_size_range',
      sql`${table.fileSizeBytes} BETWEEN 1 AND 52428800`,
    ),
  ],
);
