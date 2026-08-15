import { CursorPaginationDto } from '@/common/pagination/cursor-pagination.dto';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';

export class ChatQueryDto extends OffsetPaginationDto {}

export class ChatMessageQueryDto extends CursorPaginationDto {}
