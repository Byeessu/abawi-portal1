import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function PollMessage({ poll, conversationId, onVote }) {
  const { membre } = useAuth();
  const [voting, setVoting] = useState(false);
  const totalVotes = poll.options?.reduce((sum, o) => sum + (o.count || 0), 0) || 0;

  async function vote(optionId) {
    if (voting || poll.closed) return;
    setVoting(true);
    try {
      await supabase.from('poll_votes').insert({
        poll_id: poll.id,
        user_id: membre.id,
        option_id: optionId,
      });
      // Update count locally for instant feedback
      const updated = poll.options.map(o =>
        o.id === optionId ? { ...o, count: (o.count || 0) + 1 } : o
      );
      onVote?.({ ...poll, options: updated });
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="abv-poll">
      <div className="abv-poll-header">
        <span>📊</span>
        <span className="abv-poll-question">{poll.question}</span>
        {poll.is_anonymous && <span className="abv-poll-badge">Anonyme</span>}
        {poll.closed && <span className="abv-poll-badge abv-poll-badge--closed">Fermé</span>}
      </div>
      <div className="abv-poll-options">
        {poll.options?.map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.count || 0) / totalVotes * 100) : 0;
          return (
            <button
              key={opt.id}
              className="abv-poll-option"
              onClick={() => vote(opt.id)}
              disabled={voting || poll.closed}
            >
              <div className="abv-poll-bar" style={{ width: `${pct}%` }} />
              <span className="abv-poll-text">{opt.text}</span>
              <span className="abv-poll-count">{opt.count || 0} ({pct}%)</span>
            </button>
          );
        })}
      </div>
      <div className="abv-poll-footer">{totalVotes} vote{totalVotes > 1 ? 's' : ''}</div>
    </div>
  );
}
