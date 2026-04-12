import type { RefObject } from 'react';
import type { Trade } from '../../types/trade';
import type { ShareCardUser } from './ShareableTradeCard';
import CardA from './cards/CardA';
import CardC from './cards/CardC';

interface CardPreviewProps {
  trade: Trade;
  user: ShareCardUser;
  style: 'A' | 'C';
  cardRef?: RefObject<HTMLDivElement>;
}

export default function CardPreview({ trade, user, style, cardRef }: CardPreviewProps) {
  return (
    <div ref={cardRef}>
      {style === 'A'
        ? <CardA trade={trade} user={user} />
        : <CardC trade={trade} user={user} />
      }
    </div>
  );
}
