import type { NotificationServer } from './notifications-socket.types';
import { NotificationsRealtime } from './notifications-realtime';

describe('NotificationsRealtime', () => {
  it("signals only the owner's room, with no text", () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const realtime = new NotificationsRealtime();
    realtime.attach({ to } as unknown as NotificationServer);

    realtime.announce('11111111-1111-1111-1111-111111111111');

    expect(to).toHaveBeenCalledWith(
      'user:11111111-1111-1111-1111-111111111111',
    );
    expect(emit).toHaveBeenCalledWith('notification:new');
  });

  it('does nothing before the gateway has started', () => {
    expect(() =>
      new NotificationsRealtime().announce(
        '11111111-1111-1111-1111-111111111111',
      ),
    ).not.toThrow();
  });
});
