import { CursorPaginationDto } from '@/common/pagination/cursor-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { NotificationsController } from './notifications.controller';
import type { NotificationsService } from './notifications.service';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const notificationId = '33333333-3333-3333-3333-333333333333';

describe('NotificationsController', () => {
  it('scopes every route to the session user', () => {
    const service = {
      findMine: jest.fn(),
      countUnread: jest.fn(),
      markAllRead: jest.fn(),
      markRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;
    const controller = new NotificationsController(service);
    const query = new CursorPaginationDto();

    void controller.findMine(user, query);
    void controller.countUnread(user);
    void controller.markAllRead(user);
    void controller.markRead(user, notificationId);

    expect(service.findMine).toHaveBeenCalledWith(user.id, query);
    expect(service.countUnread).toHaveBeenCalledWith(user.id);
    expect(service.markAllRead).toHaveBeenCalledWith(user.id);
    expect(service.markRead).toHaveBeenCalledWith(user.id, notificationId);
  });
});
