import type { SessionUser } from '@/modules/auth/auth.config';
import type { CardId } from '@/modules/payment/providers/omise/types';
import type Omise from 'omise';

export function createOmiseCustomer(
  user: SessionUser,
): Omise.Customers.IRequest {
  return {
    email: user.email,
    description: `Name: ${user.name}; Full Name: ${user.fullName};`,
    metadata: {
      userId: user.id,
    },
  };
}

export function sortCardsDescendingAddDate(
  cards: Omise.Cards.ICard[],
): Omise.Cards.ICard[] {
  return cards.toSorted(
    (a, b) =>
      new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf(),
  );
}

export function getCardIds(cards: Omise.Cards.ICard[]): CardId[] {
  return cards.map((card) => card.id as CardId);
}
