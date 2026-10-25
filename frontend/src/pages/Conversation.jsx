import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ChevronLeft, Shield } from 'lucide-react';
import { conversationApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { avatarFor } from '../assets/photos';

export default function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => conversationApi.getById(id),
    refetchInterval: 10000,
    retry: false,
  });

  const conv = data?.data?.data?.conversation;
  const messages = conv?.messages || [];
  const other = conv?.userA?.id === user?.id ? conv?.userB : conv?.userA;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await conversationApi.sendMessage(id, message.trim());
      setMessage('');
      queryClient.invalidateQueries(['conversation', id]);
    } catch {}
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="card px-3 py-2.5 mb-3 flex items-center gap-3">
        <button onClick={() => navigate('/messages')} className="p-1.5 rounded-xl text-clay hover:bg-sand hover:text-charcoal transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="relative flex-shrink-0">
          <img src={avatarFor(other)} alt="" className="w-10 h-10 rounded-2xl object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-olive ring-2 ring-card" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-charcoal truncate">{other?.firstName} {other?.lastName}</p>
          <p className="text-2xs text-olive font-medium flex items-center gap-1"><Shield size={10} /> Verified · Connected</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pb-2 px-1">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-3xl bg-sand mx-auto mb-3 flex items-center justify-center">
              <img src={avatarFor(other)} alt="" className="w-10 h-10 rounded-2xl object-cover" />
            </div>
            <p className="font-display font-bold text-charcoal text-sm mb-1">Say hello to {other?.firstName || 'your match'}</p>
            <p className="text-xs text-clay">Introduce yourself and share what you’re looking for.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <img src={avatarFor(other)} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />}
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe ? 'bg-brand-500 text-white rounded-br-md' : 'bg-card text-charcoal rounded-bl-md shadow-sm border border-charcoal/[0.06]'
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-clay'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="card p-2 flex items-end gap-2 mt-3">
        <textarea
          className="flex-1 resize-none bg-transparent outline-none text-sm text-charcoal placeholder-clay/60 max-h-24 px-3 py-2"
          placeholder="Type a message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!message.trim() || sending}
          className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-brand-600 transition-colors flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
