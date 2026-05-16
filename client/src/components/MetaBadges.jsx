export function ClockBadge({ time }) {
  return (
    <span className="meta-badge">
      <img src="/icons/clock.png" alt="" />
      {time}
    </span>
  );
}

export function TicketBadge({ price }) {
  return (
    <span className="meta-badge">
      <img src="/icons/ticket.png" alt="" />
      {Number(price).toLocaleString('ru-RU')} ₽
    </span>
  );
}

export function AgeBadge({ rating }) {
  return <span className="age-badge">{rating}</span>;
}
