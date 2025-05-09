
import React from 'react';
import { useUser } from '../contexts/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Trash, Settings } from 'lucide-react';

export const ChatControls: React.FC = () => {
  const { clearHistory, startNewChat } = useUser();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={startNewChat}>
          Novo chat
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={clearHistory}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="h-4 w-4 mr-2" />
          Limpar Histórico
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
