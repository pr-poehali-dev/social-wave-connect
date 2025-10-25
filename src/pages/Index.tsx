import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  is_online: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  content?: string;
  image_url?: string;
  created_at: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentChatId, setCurrentChatId] = useState<number | null>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  const handleAuth = () => {
    if (isLogin) {
      const mockUser: User = {
        id: Math.floor(Math.random() * 10000) + 100,
        username: username || 'User',
        email: email || 'user@example.com',
        avatar_url: undefined,
        bio: '',
        is_online: true
      };
      setCurrentUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      toast({ title: 'Добро пожаловать!', description: `Вы вошли как ${mockUser.username}` });
    } else {
      const mockUser: User = {
        id: Math.floor(Math.random() * 10000) + 100,
        username,
        email,
        avatar_url: undefined,
        bio,
        is_online: true
      };
      setCurrentUser(mockUser);
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      toast({ title: 'Регистрация успешна!', description: `Добро пожаловать, ${username}!` });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setMessages([]);
    setCurrentChatId(null);
    toast({ title: 'Вы вышли из аккаунта' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Date.now(),
      sender_id: currentUser.id,
      content: messageInput,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');

    if (currentChatId === 1) {
      setTimeout(() => {
        const botReply: Message = {
          id: Date.now() + 1,
          sender_id: 1,
          content: 'Извините, я не могу отвечать на сообщения.',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, botReply]);
      }, 1000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newMessage: Message = {
        id: Date.now(),
        sender_id: currentUser.id,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      };
      setMessages([...messages, newMessage]);
      toast({ title: 'Фото отправлено!' });
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = () => {
      const avatarUrl = reader.result as string;
      const updatedUser = { ...currentUser, avatar_url: avatarUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      toast({ title: 'Аватар обновлен!' });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, bio };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    toast({ title: 'Профиль обновлен!' });
    setShowProfile(false);
  };

  const onlineUsers = [
    { id: 1, username: 'Ti Test', is_online: true, avatar_url: 'https://cdn.poehali.dev/files/0cf5ff42-8ede-4053-a0b8-1f0a14461975.png' },
    { id: 2, username: 'Alice', is_online: true, avatar_url: undefined },
    { id: 3, username: 'Bob', is_online: true, avatar_url: undefined },
  ];

  const offlineUsers = [
    { id: 4, username: 'Charlie', is_online: false, avatar_url: undefined },
    { id: 5, username: 'Diana', is_online: false, avatar_url: undefined },
  ];

  const filteredOnline = onlineUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOffline = offlineUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0EA5E9] via-[#0891B2] to-[#06B6D4] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-sm border-border/50">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center mb-4 shadow-lg">
              <span className="text-5xl font-black text-white">T</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">SocialNet</h1>
            <p className="text-muted-foreground">Общайся с друзьями</p>
          </div>

          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Input
                placeholder="Email или имя пользователя"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary"
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary"
              />
              <Button onClick={handleAuth} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] hover:opacity-90">
                Войти
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Input
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-secondary"
              />
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary"
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary"
              />
              <Input
                placeholder="О себе (необязательно)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-secondary"
              />
              <Button onClick={handleAuth} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] hover:opacity-90">
                Зарегистрироваться
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  if (showProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Профиль</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowProfile(false)}>
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={currentUser.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white text-2xl">
                  {currentUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-4 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:opacity-90">
                <Icon name="Camera" size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <h3 className="text-xl font-semibold">{currentUser.username}</h3>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">О себе</label>
              <Input
                placeholder="Расскажите о себе..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-secondary"
              />
            </div>

            <Button onClick={handleUpdateProfile} className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] hover:opacity-90">
              Сохранить
            </Button>

            <Button variant="outline" onClick={handleLogout} className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Выйти
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center">
              <span className="text-xl font-black text-white">T</span>
            </div>
            <h1 className="text-xl font-bold">SocialNet</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUser.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white text-sm">
                {currentUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <h3 className="text-sm font-semibold text-muted-foreground">ОНЛАЙН ({filteredOnline.length})</h3>
              </div>
              <div className="space-y-1">
                {filteredOnline.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setCurrentChatId(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-secondary ${
                      currentChatId === user.id ? 'bg-secondary' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white">
                          {user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground">В сети</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <h3 className="text-sm font-semibold text-muted-foreground">ОФЛАЙН ({filteredOffline.length})</h3>
              </div>
              <div className="space-y-1">
                {filteredOffline.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setCurrentChatId(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-secondary opacity-60 ${
                      currentChatId === user.id ? 'bg-secondary' : ''
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-muted text-foreground">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground">Не в сети</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {currentChatId ? (
          <>
            <div className="h-16 border-b border-border px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentChatId === 1 ? 'https://cdn.poehali.dev/files/0cf5ff42-8ede-4053-a0b8-1f0a14461975.png' : undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white">
                    {currentChatId === 1 ? 'T' : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{currentChatId === 1 ? 'Ti Test' : 'User'}</h2>
                  <p className="text-xs text-muted-foreground">
                    {currentChatId === 1 ? 'В сети' : 'Не в сети'}
                  </p>
                </div>
              </div>
              {currentChatId === 1 && (
                <Badge variant="secondary" className="bg-secondary/50">
                  Тестовый бот
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[70%] ${msg.sender_id === currentUser.id ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-end gap-2">
                        {msg.sender_id !== currentUser.id && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="https://cdn.poehali.dev/files/0cf5ff42-8ede-4053-a0b8-1f0a14461975.png" />
                            <AvatarFallback className="bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-white text-xs">
                              T
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {msg.content && (
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                msg.sender_id === currentUser.id
                                  ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white'
                                  : 'bg-secondary text-foreground'
                              }`}
                            >
                              {msg.content}
                            </div>
                          )}
                          {msg.image_url && (
                            <img src={msg.image_url} alt="Sent" className="rounded-2xl max-w-xs mt-1" />
                          )}
                          <p className="text-xs text-muted-foreground mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <Button variant="ghost" size="icon" className="hover:bg-secondary" asChild>
                    <div>
                      <Icon name="ImagePlus" size={20} />
                    </div>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <Input
                  placeholder="Напишите сообщение..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-secondary"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] hover:opacity-90"
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center mx-auto mb-4">
                <Icon name="MessageCircle" size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Выберите чат</h3>
              <p className="text-muted-foreground">Начните общение с друзьями</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;