import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  ApiCreate,
  ApiDelete,
  ApiGetCursorPaginated,
  ApiGetOne,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { CursorPaginatedResult } from '@/common/pagination/cursor-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { MAX_CHAT_FILE_BYTES } from './chat-files.constants';
import { ChatFilesService } from './chat-files.service';
import { CHAT_MESSAGES } from './chat.constants';
import {
  ChatFileResponseDto,
  ChatFileUrlResponseDto,
} from './dtos/chat-file-response.dto';
import { ChatFileQueryDto } from './dtos/chat-query.dto';

@ApiTags('Chat')
@Controller('chat/rooms/:chatRoomId/files')
export class ChatFilesController {
  constructor(private readonly chatFiles: ChatFilesService) {}

  @Get()
  @ResponseMessage(CHAT_MESSAGES.filesFound)
  @ApiGetCursorPaginated(ChatFileResponseDto, { name: 'Chat file' })
  findFiles(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
    @Query() query: ChatFileQueryDto,
  ): Promise<CursorPaginatedResult<ChatFileResponseDto>> {
    return this.chatFiles.findFiles(user.id, chatRoomId, query);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CHAT_FILE_BYTES, files: 1 },
    }),
  )
  @ResponseMessage(CHAT_MESSAGES.fileUploaded)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreate(ChatFileResponseDto, { name: 'Chat file' })
  upload(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ChatFileResponseDto> {
    return this.chatFiles.upload(user.id, chatRoomId, file);
  }

  @Get(':fileId')
  @ApiGetOne(ChatFileUrlResponseDto, { name: 'Chat file URL' })
  createDownloadUrl(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<ChatFileUrlResponseDto> {
    return this.chatFiles.createDownloadUrl(user.id, chatRoomId, fileId);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(CHAT_MESSAGES.fileRemoved)
  @ApiDelete(ChatFileResponseDto, { name: 'Chat file' })
  remove(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<ChatFileResponseDto> {
    return this.chatFiles.remove(user.id, chatRoomId, fileId);
  }
}
