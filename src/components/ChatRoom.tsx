import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Copy, Users } from 'lucide-react';

interface Message {
  id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  created_at: string;
  expires_at: string;
}

interface ChatRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onLeaveRoom }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load stored username
    const storedUsername = localStorage.getItem('chatroom-username');
    if (storedUsername) {
      setUsername(storedUsername);
      setIsUsernameSet(true);
    }

    // Fetch room details
    const fetchRoom = async () => {
      const { data, error } = await (supabase as any)
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room:', error);
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive"
        });
        return;
      }

      setRoom(data);
    };

    // Fetch messages
    const fetchMessages = async () => {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchRoom();
    fetchMessages();

    // Set up realtime subscription for messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, toast]);

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    localStorage.setItem('chatroom-username', username.trim());
    setIsUsernameSet(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !username.trim()) return;

    setIsSending(true);
    
    try {
      const { error } = await (supabase as any)
        .from('messages')
        .insert([{
          room_id: roomId,
          username: username.trim(),
          content: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Room link copied to clipboard"
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isUsernameSet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Join Chat Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetUsername} className="space-y-4">
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
              required
            />
            <Button type="submit" className="w-full">
              Join Room
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onLeaveRoom}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{room?.name}</h1>
            {room?.description && (
              <p className="text-sm text-muted-foreground">{room.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {messages.filter((msg, index, arr) => 
              arr.findIndex(m => m.username === msg.username) === index
            ).length}
          </Badge>
          <Button variant="outline" size="sm" onClick={copyRoomLink}>
            <Copy className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{message.username}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            maxLength={1000}
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;