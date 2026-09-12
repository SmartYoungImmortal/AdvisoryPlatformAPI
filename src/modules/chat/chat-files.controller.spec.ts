import { ChatFilesController } from './chat-files.controller';
import type { ChatFilesService } from './chat-files.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChatFileResponseDto } from './dtos/chat-file-response.dto';
import { ChatFileQueryDto } from './dtos/chat-query.dto';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const chatRoomId = '33333333-3333-3333-3333-333333333333';
const fileId = '44444444-4444-4444-4444-444444444444';

describe('ChatFilesController', () => {
  let controller: ChatFilesController;
  let chatFiles: jest.Mocked<ChatFilesService>;

  function stubFile(): Promise<ChatFileResponseDto> {
    return Promise.resolve({ id: fileId } as ChatFileResponseDto);
  }

  beforeEach(() => {
    chatFiles = {
      findFiles: jest.fn(),
      upload: jest.fn(),
      createDownloadUrl: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<ChatFilesService>;
    controller = new ChatFilesController(chatFiles);
  });

  it('delegates the cursor-paginated file feed using the session user', () => {
    const query = new ChatFileQueryDto();
    const result = Promise.resolve({
      items: [],
      limit: 20,
      nextCursor: null,
      hasMore: false,
    });
    chatFiles.findFiles.mockReturnValue(result);

    expect(controller.findFiles(user, chatRoomId, query)).toBe(result);
    expect(chatFiles.findFiles).toHaveBeenCalledWith(
      user.id,
      chatRoomId,
      query,
    );
  });

  it('passes the uploaded file through with the room and session user', () => {
    const upload = {
      buffer: Buffer.from('x'),
      mimetype: 'application/pdf',
      size: 1,
      originalname: 'brief.pdf',
    } as Express.Multer.File;
    const result = stubFile();
    chatFiles.upload.mockReturnValue(result);

    expect(controller.upload(user, chatRoomId, upload)).toBe(result);
    expect(chatFiles.upload).toHaveBeenCalledWith(user.id, chatRoomId, upload);
  });

  it('lets the service reject a missing file rather than guessing in the controller', () => {
    const result = stubFile();
    chatFiles.upload.mockReturnValue(result);

    expect(controller.upload(user, chatRoomId, undefined)).toBe(result);
    expect(chatFiles.upload).toHaveBeenCalledWith(
      user.id,
      chatRoomId,
      undefined,
    );
  });

  it('delegates the signed download URL using the room and file id', () => {
    const result = Promise.resolve({
      url: 'https://signed.test/x',
      expiresInSeconds: 300,
    });
    chatFiles.createDownloadUrl.mockReturnValue(result);

    expect(controller.createDownloadUrl(user, chatRoomId, fileId)).toBe(result);
    expect(chatFiles.createDownloadUrl).toHaveBeenCalledWith(
      user.id,
      chatRoomId,
      fileId,
    );
  });

  it('delegates removal using the room and file id', () => {
    const result = stubFile();
    chatFiles.remove.mockReturnValue(result);

    expect(controller.remove(user, chatRoomId, fileId)).toBe(result);
    expect(chatFiles.remove).toHaveBeenCalledWith(user.id, chatRoomId, fileId);
  });
});
