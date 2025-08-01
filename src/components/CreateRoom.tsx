import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateRoomProps {
  onRoomCreated: (roomId: string) => void;
}

const CreateRoom: React.FC<CreateRoomProps> = ({ onRoomCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { data, error } = await (supabase as any)
        .from('rooms')
        .insert([{ name: name.trim(), description: description.trim() || null }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Room created successfully!"
        });

        onRoomCreated(data.id);
        setName('');
        setDescription('');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Chat Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <Input
              placeholder="Room name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? 'Creating...' : 'Create Room'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateRoom;