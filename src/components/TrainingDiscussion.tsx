import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, MessageSquare, Clock, User, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionMessage {
  id: string;
  training_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

interface TrainingDiscussionProps {
  trainingId: string;
  trainingTitle: string;
}

export const TrainingDiscussion: React.FC<TrainingDiscussionProps> = ({ trainingId, trainingTitle }) => {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = localStorage.getItem('userId') || '';
  const currentUserName = localStorage.getItem('userName') || 'Anonymous';

  useEffect(() => {
    loadDiscussions();
    // Poll for new messages every 10 seconds for a "live" feel
    const interval = setInterval(loadDiscussions, 10000);
    return () => clearInterval(interval);
  }, [trainingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadDiscussions = async () => {
    try {
      const { data, error } = await api.getTrainingDiscussions(trainingId);
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await api.createTrainingDiscussion(trainingId, {
        user_id: currentUserId,
        message: newMessage.trim()
      });

      if (error) throw error;

      setNewMessage('');
      // Optimistically update the UI or just reload
      loadDiscussions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post message',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="glass-card flex flex-col h-[500px] border-white/10 shadow-glow overflow-hidden">
      <CardHeader className="border-b border-white/5 py-4 px-6 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Discussion Board</CardTitle>
              <p className="text-xs text-muted-foreground opacity-70 truncate max-w-[250px]">{trainingTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Feed</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <div className="p-4 rounded-full bg-muted/50">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div>
                <p className="font-bold">No discussions yet</p>
                <p className="text-sm">Be the first to start the conversation!</p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isMe = msg.user_id === currentUserId;
                const isAdmin = msg.user_role === 'administrator' || msg.user_role === 'training_head';
                
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3`}
                  >
                    {!isMe && (
                      <Avatar className="w-9 h-9 border-2 border-white/10 shadow-sm mt-1 shrink-0">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {getInitials(msg.user_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        {!isMe && (
                          <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">
                            {msg.user_name}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="flex items-center gap-1 text-[9px] font-black bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">
                            <ShieldCheck className="w-2.5 h-2.5" /> Staff
                          </span>
                        )}
                      </div>
                      
                      <div className={`
                        p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                        ${isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-none shadow-glow' 
                          : 'bg-muted/50 dark:bg-white/5 border border-white/5 rounded-tl-none'
                        }
                      `}>
                        {msg.message}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1.5 px-1 opacity-50">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-medium">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {isMe && (
                      <Avatar className="w-9 h-9 border-2 border-primary/20 shadow-glow mt-1 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                          ME
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        
        <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <Input
              placeholder="Write a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 h-12 bg-background/50 border-white/10 rounded-xl pr-12 focus:ring-primary/20"
              disabled={submitting}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || submitting}
              className={`absolute right-1.5 h-9 w-9 rounded-lg transition-all ${newMessage.trim() ? 'bg-primary shadow-glow scale-100' : 'bg-muted opacity-50 scale-90'}`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[9px] text-center mt-2 text-muted-foreground opacity-50 uppercase tracking-[0.2em] font-bold">
            All messages are logged for compliance monitoring
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
