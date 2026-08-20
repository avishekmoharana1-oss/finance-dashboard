import { Inbox } from 'lucide-react';

export default function EmptyState({ title, message, icon: Icon, action }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-icon">{Icon ? <Icon size={28} /> : <Inbox size={28} />}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
