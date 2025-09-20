import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Send, Users, Scroll, Sparkles } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'https://p9hwiqcq7e1g.manus.space/api/grimorio';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [npcs, setNpcs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchNpcs();
    // Mensagem inicial de Ormund
    addOrmundIntroduction();
  }, []);

  const fetchNpcs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/npcs`);
      const data = await response.json();
      if (data.success) {
        setNpcs(data.npcs);
      }
    } catch (error) {
      console.error('Erro ao carregar NPCs:', error);
    }
  };

  const addOrmundIntroduction = () => {
    const introMessage = {
      id: Date.now(),
      text: "🎭 Ormund: Bem-vindos ao Grimório D&D! Sou Ormund, seu Mestre do Jogo. Que aventura desejam viver hoje? Temos a 'Noite dos Uivos' ou a 'Cova dos Esquecidos' disponíveis. Escolham sabiamente, heróis!",
      sender: 'ormund',
      character: 'ormund',
      color: '#FFD700',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages([introMessage]);
  };

  const handleSendMessage = async () => {
    if (input.trim() !== '' && !isLoading) {
      const userMessage = {
        id: Date.now(),
        text: input,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentInput = input;
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            character: 'ormund',
            session_id: 'grimorio_session_123',
            history: messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }))
          }),
        });

        const data = await response.json();
        if (data.success) {
          const aiMessage = {
            id: Date.now() + 1,
            text: `🎭 Ormund: ${data.response}`,
            sender: 'ormund',
            character: 'ormund',
            color: '#FFD700',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          console.error('Erro do backend:', data.error);
          const errorMessage = {
            id: Date.now() + 1,
            text: `Erro: ${data.error}`,
            sender: 'system',
            color: '#FF0000',
            timestamp: new Date().toLocaleTimeString()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        const errorMessage = {
          id: Date.now() + 1,
          text: 'Erro ao conectar com o servidor.',
          sender: 'system',
          color: '#FF0000',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRollDice = async (diceType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dice/${diceType}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        const rollMessage = {
          id: Date.now(),
          text: `🎲 Rolou d${diceType}: ${data.roll}`,
          sender: 'system',
          color: '#C0C0C0',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, rollMessage]);
      } else {
        console.error('Erro ao rolar dado:', data.error);
        const errorMessage = {
          id: Date.now() + 1,
          text: `Erro ao rolar dado: ${data.error}`,
          sender: 'system',
          color: '#FF0000',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Erro ao rolar dado:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Erro ao conectar com o servidor para rolar dado.',
        sender: 'system',
        color: '#FF0000',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleNpcClick = async (npc) => {
    if (isLoading) return;
    
    setSelectedNpc(npc);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Olá ${npc.name}`,
          character: npc.id,
          session_id: 'grimorio_session_123',
          history: messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }))
        }),
      });

      const data = await response.json();
      if (data.success) {
        const npcMessage = {
          id: Date.now(),
          text: `${npc.name}: ${data.response}`,
          sender: 'npc',
          character: npc.id,
          color: npc.color,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, npcMessage]);
      } else {
        console.error('Erro do backend ao interagir com NPC:', data.error);
        const errorMessage = {
          id: Date.now() + 1,
          text: `Erro: ${data.error}`,
          sender: 'system',
          color: '#FF0000',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Erro ao interagir com NPC:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Erro ao conectar com o servidor para interagir com NPC.',
        sender: 'system',
        color: '#FF0000',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDiceIcon = (sides) => {
    const icons = {
      4: Dice1, 6: Dice2, 8: Dice3, 10: Dice4, 12: Dice5, 20: Dice6
    };
    const Icon = icons[sides] || Dice1;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              🔮 Grimório D&D
            </h1>
            <Badge variant="secondary" className="ml-auto">
              Jogo Interativo
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <Scroll className="w-5 h-5" />
                  Aventura em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col">
                
                {/* Messages Display */}
                <ScrollArea className="flex-1 mb-4 pr-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender === 'user'
                              ? 'bg-purple-600/80 text-white'
                              : 'bg-slate-800/80 border border-purple-800/30'
                          }`}
                          style={{ 
                            color: msg.sender !== 'user' ? msg.color : undefined,
                            borderLeft: msg.sender !== 'user' ? `4px solid ${msg.color}` : undefined
                          }}
                        >
                          <div className="text-sm font-medium mb-1">
                            {msg.sender === 'user' ? 'Você' : 
                             msg.sender === 'system' ? 'Sistema' : 
                             msg.character || 'Narrador'}
                          </div>
                          <div className="text-sm opacity-90 whitespace-pre-wrap">
                            {msg.text}
                          </div>
                          <div className="text-xs opacity-60 mt-1">
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800/80 border border-purple-800/30 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                            <span className="text-sm">Digitando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua ação ou fala..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-800/50 border-purple-800/30 text-white placeholder:text-gray-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !input.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Dice Roller */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[4, 6, 8, 10, 12, 20].map((sides) => (
                    <Button
                      key={sides}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollDice(sides)}
                      className="border-purple-800/30 text-yellow-400 hover:bg-purple-800/20"
                    >
                      {getDiceIcon(sides)}
                      d{sides}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* NPCs */}
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <Users className="w-5 h-5" />
                  Personagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {npcs.map((npc) => (
                    <Button
                      key={npc.id}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3 hover:bg-purple-800/20"
                      onClick={() => handleNpcClick(npc)}
                      disabled={isLoading}
                    >
                      <div className="flex flex-col items-start">
                        <div 
                          className="font-medium text-sm"
                          style={{ color: npc.color }}
                        >
                          {npc.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {npc.class}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Controls */}
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-400">Controles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full border-purple-800/30 text-yellow-400 hover:bg-purple-800/20"
                >
                  Salvar Progresso
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-purple-800/30 text-yellow-400 hover:bg-purple-800/20"
                >
                  Resetar Afinidades
                </Button>
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="bg-black/40 border-purple-800/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-400">Missões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-slate-800/50 rounded border-l-4 border-yellow-400">
                  <div className="font-medium text-yellow-400">Noite dos Uivos</div>
                  <div className="text-gray-300 text-xs">Vila aterrorizada por criaturas</div>
                </div>
                <div className="p-2 bg-slate-800/50 rounded border-l-4 border-purple-400">
                  <div className="font-medium text-purple-400">Cova dos Esquecidos</div>
                  <div className="text-gray-300 text-xs">Artefatos antigos despertando</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
