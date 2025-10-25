import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    setCurrentUser(JSON.parse(userStr));
    fetchUsers();
  }, []);

  const fetchUsers = async (searchQuery = '') => {
    try {
      const url = `https://functions.poehali.dev/5fade399-02e8-46d6-86b1-762a8ea49b0e${searchQuery ? `?search=${searchQuery}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchUsers(value);
  };

  const handleStartChat = async (userId: number) => {
    if (!currentUser) return;

    try {
      const response = await fetch('https://functions.poehali.dev/bb63da8d-1f5a-436c-bf89-e100d310806e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_chat',
          user1_id: currentUser.id,
          user2_id: userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/chat/${data.chat_id}`);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const onlineUsers = users.filter(u => u.is_online && u.id !== currentUser?.id);
  const offlineUsers = users.filter(u => !u.is_online && u.id !== currentUser?.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.poehali.dev/projects/75f35854-e74d-4b6f-95cc-8a5ac2392656/files/287e9439-819e-4347-a07e-4e8764057ee7.jpg" 
              alt="Logo" 
              className="w-10 h-10 rounded-xl"
            />
            <h1 className="text-2xl font-bold text-foreground">SocialWave</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/profile')}
            >
              <Icon name="User" size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
            >
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <div className="relative">
            <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск пользователей..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border text-foreground"
            />
          </div>
        </div>

        <div className="space-y-6">
          {onlineUsers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Онлайн ({onlineUsers.length})
              </h2>
              <div className="space-y-2">
                {onlineUsers.map(user => (
                  <Card 
                    key={user.id} 
                    className="p-4 bg-card border-border hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleStartChat(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-card"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Icon name="MessageCircle" size={20} className="text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {offlineUsers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                Оффлайн ({offlineUsers.length})
              </h2>
              <div className="space-y-2">
                {offlineUsers.map(user => (
                  <Card 
                    key={user.id} 
                    className="p-4 bg-card border-border hover:bg-secondary cursor-pointer transition-colors opacity-60"
                    onClick={() => handleStartChat(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Icon name="MessageCircle" size={20} className="text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
