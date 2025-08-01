import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateRoom from '@/components/CreateRoom';
import RoomList from '@/components/RoomList';
import ChatRoom from '@/components/ChatRoom';
import { MessageCircle, Plus } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('rooms');

  // Check for room ID in URL on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    if (roomId) {
      setCurrentRoomId(roomId);
      setCurrentView('chat');
    }
  }, []);

  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    setCurrentView('chat');
    // Update URL without page reload
    const newUrl = `${window.location.origin}?room=${roomId}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleLeaveRoom = () => {
    setCurrentView('home');
    setCurrentRoomId(null);
    // Clear URL params
    window.history.pushState({}, '', window.location.origin);
  };

  const handleRoomCreated = (roomId: string) => {
    handleJoinRoom(roomId);
  };

  if (currentView === 'chat' && currentRoomId) {
    return (
      <ChatRoom 
        roomId={currentRoomId} 
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Chat Rooms</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Create or join temporary chat rooms that expire in 24 hours
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="rooms">Active Rooms</TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Room
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rooms">
              <RoomList onJoinRoom={handleJoinRoom} />
            </TabsContent>
            
            <TabsContent value="create">
              <CreateRoom onRoomCreated={handleRoomCreated} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
