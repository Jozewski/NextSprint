import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const mentionNamesFrom = (text) => {
  const names = new Set();
  const matches = text.matchAll(/@([A-Za-z][A-Za-z0-9_-]*)/g);
  for (const match of matches) {
    names.add(match[1]);
  }
  return [...names];
};

const initialsFor = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function ChatSidebar({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    api('/api/chat/messages')
      .then((data) => {
        if (!active) return;
        setMessages([...(data.messages || [])].reverse());
        setOnlineCount(data.onlineCount || 0);
        setLoaded(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const trimmedDraft = draft.trim();
  const mentions = useMemo(() => mentionNamesFrom(trimmedDraft), [trimmedDraft]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!trimmedDraft) return;

    const data = await api('/api/chat/messages', {
      method: 'POST',
      body: { body: trimmedDraft, mentions },
    });
    setMessages((current) => [...current, data.message]);
    setDraft('');
  }

  if (!loaded) return null;

  return (
    <section
      aria-label="Team chat"
      className="border-t border-slate-800 px-3 py-4"
    >
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 text-indigo-300"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Team chat</span>
        </h2>
        <span className="text-xs text-slate-400">{onlineCount} online</span>
      </div>

      {error ? <p className="px-2 text-xs text-red-300">{error}</p> : null}

      <div className="max-h-72 space-y-3 overflow-y-auto px-2">
        {messages.map((message) => {
          const isCurrentUser = message.author?.id === currentUser?.id;
          const authorName = isCurrentUser ? 'You' : message.author?.name;
          const initials = message.author?.initials || initialsFor(message.author?.name);

          return (
            <article key={message.id} className={isCurrentUser ? 'text-right' : ''}>
              <div className={`flex gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                {!isCurrentUser ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-indigo-200">
                    {initials}
                  </span>
                ) : null}
                <div className={isCurrentUser ? 'max-w-[10rem]' : 'max-w-[9.5rem]'}>
                  <p className="mb-1 text-xs font-medium text-slate-400">{authorName}</p>
                  <p
                    className={`rounded-md px-3 py-2 text-left text-sm ${
                      isCurrentUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-100'
                    }`}
                  >
                    {message.body}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message the team..."
          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Send
        </button>
      </form>
    </section>
  );
}
