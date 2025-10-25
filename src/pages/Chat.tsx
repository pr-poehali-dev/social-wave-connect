import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  avatar_url: string | null;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string | null;
  image_url: string | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    fetchMessages();

    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/bb63da8d-1f5a-436c-bf89-e100d310806e?action=get_messages&chat_id=${chatId}`
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setSending(true);

    try {
      const response = await fetch('https://functions.poehali.dev/bb63da8d-1f5a-436c-bf89-e100d310806e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: Number(chatId),
          sender_id: currentUser.id,
          content: newMessage,
          image_url: null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('https://api.poehali.dev/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.url) {
        const response = await fetch('https://functions.poehali.dev/bb63da8d-1f5a-436c-bf89-e100d310806e', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            chat_id: Number(chatId),
            sender_id: currentUser.id,
            content: null,
            image_url: uploadData.url,
          }),
        });

        const data = await response.json();
        if (data.success) {
          fetchMessages();
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Чат</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={message.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {message.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                <p className="text-xs text-muted-foreground mb-1">{message.username}</p>
                {message.image_url ? (
                  <img 
                    src={message.image_url} 
                    alt="Attachment" 
                    className="rounded-lg max-w-full h-auto"
                  />
                ) : (
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={sending}
              asChild
            >
              <span>
                <Icon name="ImagePlus" size={20} />
              </span>
            </Button>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={sending}
          />
          <Input
            type="text"
            placeholder="Напишите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-secondary border-border text-foreground"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Icon name="Send" size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
