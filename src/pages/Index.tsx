
import ChatInterface from "@/components/ChatInterface";
import { UserProvider } from "../contexts/UserContext";

const Index = () => {
  return (
    <UserProvider>
      <div className="min-h-screen bg-background">
        <ChatInterface />
      </div>
    </UserProvider>
  );
};

export default Index;
