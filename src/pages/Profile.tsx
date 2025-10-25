import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    setUser(JSON.parse(userStr));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('https://api.poehali.dev/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.url) {
        const response = await fetch('https://functions.poehali.dev/de27768f-e906-4dba-9ab3-ad09edeeea6d', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            avatar_url: uploadData.url,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast({
            title: 'Успешно',
            description: 'Аватар обновлен',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить аватар',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 bg-card border-border">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative group">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <Icon name="Camera" size={32} className="text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-foreground">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                <Icon name="Mail" size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                <Icon name="User" size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Имя пользователя</p>
                  <p className="text-foreground">{user.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                <div className={`w-3 h-3 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <div>
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <p className="text-foreground">{user.is_online ? 'Онлайн' : 'Оффлайн'}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate('/')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icon name="MessageCircle" size={20} className="mr-2" />
              К сообщениям
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
