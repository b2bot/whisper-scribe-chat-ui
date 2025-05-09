
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserRound, Plus, Settings, Edit, Users } from 'lucide-react';

export const UserSelector: React.FC = () => {
  const { 
    currentUserId, 
    userSessions, 
    switchUser, 
    createNewUser, 
    setUserNickname 
  } = useUser();
  
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  
  // Get current user nickname or show abbreviated ID
  const getCurrentUserName = () => {
    const currentUser = userSessions.find(u => u.id === currentUserId);
    if (currentUser?.nickname) {
      return currentUser.nickname;
    }
    return `User ${currentUserId.substring(0, 5)}...`;
  };
  
  // Handle save nickname
  const handleSaveNickname = () => {
    if (newNickname.trim()) {
      setUserNickname(currentUserId, newNickname);
      setIsEditingNickname(false);
      setNewNickname('');
    }
  };
  
  return (
    <div className="flex items-center">
      {isEditingNickname ? (
        <div className="flex items-center space-x-2">
          <Input
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="Enter nickname"
            className="h-8 w-40"
            autoFocus
          />
          <Button size="sm" onClick={handleSaveNickname}>Save</Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsEditingNickname(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              <span>{getCurrentUserName()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Meu Painel</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setIsEditingNickname(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              <span>Nome de Usuário</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={createNewUser}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Sessão</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {userSessions.length > 0 && (
              <>
                <DropdownMenuLabel>Trocar de Sessão</DropdownMenuLabel>
                {userSessions.map((session) => (
                  <DropdownMenuItem 
                    key={session.id}
                    onClick={() => switchUser(session.id)}
                    className={`flex items-center gap-2 ${session.id === currentUserId ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    <UserRound className="h-4 w-4" />
                    <span>
                      {session.nickname || `User ${session.id.substring(0, 5)}...`}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
