import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Settings,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  X,
  Minimize2
} from "lucide-react";

interface ChatInterfaceProps {
  agentId: number;
  agentName: string;
  agentPreset: string;
  onClose: () => void;
  onMinimize: () => void;
}

export function ChatInterface({ agentId, agentName, agentPreset, onClose, onMinimize }: ChatInterfaceProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system" as const,
      content: "Data Analyzer Bot이 활성화되었습니다. 데이터 분석과 시각화 작업을 도와드리겠습니다.",
      timestamp: "10:30 AM"
    },
    {
      id: 2,
      type: "user" as const,
      content: "안녕하세요! 최근 매출 데이터를 분석해주실 수 있나요?",
      timestamp: "10:31 AM"
    },
    {
      id: 3,
      type: "agent" as const,
      content: "안녕하세요! 네, 매출 데이터 분석을 도와드리겠습니다. 먼저 분석하고 싶은 데이터 파일을 업로드해주시거나, 구체적인 분석 요구사항을 알려주세요.\n\n다음과 같은 분석이 가능합니다:\n• 시계열 매출 트렌드 분석\n• 제품별/지역별 매출 비교\n• 성장률 및 예측 분석\n• 시각화 차트 생성",
      timestamp: "10:31 AM"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user" as const,
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      const agentResponse = {
        id: messages.length + 2,
        type: "agent" as const,
        content: "데이터를 분석중입니다. 잠시만 기다려주세요...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4" />;
      case 'agent': return <Bot className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getMessageBg = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-50 border-blue-200';
      case 'agent': return 'bg-green-50 border-green-200';
      case 'system': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <Card className="w-96 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">{agentName}</h3>
            <p className="text-xs text-muted-foreground">{agentPreset}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onMinimize}>
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`p-3 rounded-lg border ${getMessageBg(message.type)}`}>
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize">{message.type}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            </div>
            
            {message.type === 'agent' && (
              <div className="flex gap-2 ml-6">
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Good
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ThumbsDown className="w-3 h-3 mr-1" />
                  Bad
                </Button>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="w-4 h-4" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm">typing...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}