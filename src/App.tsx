import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Search, Plus, Minus, ArrowRight } from 'lucide-react';
import './index.css';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  type?: 'text' | 'options' | 'date-picker' | 'time-picker' | 'people-picker' | 'checkout';
  options?: string[];
  time: string;
};

type UserData = {
  name: string;
  date: string;
  time: string;
  people: number;
};

const getDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 3; i++) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    dates.push({
      date: next.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weekday: next.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      day: next.getDate()
    });
  }
  return dates;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({ name: '', date: '', time: '', people: 2 });
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const addMessage = (msg: Omit<Message, 'id' | 'time'>) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(), time: getCurrentTime() }]);
  };

  const simulateTyping = (callback: () => void, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  useEffect(() => {
    // Initial message
    simulateTyping(() => {
      addMessage({
        sender: 'bot',
        text: 'Olá! Seja bem-vindo ao assistente virtual do *Restaurante Romã* 🍷.\n\nGostaria de iniciar uma reserva?',
        type: 'options',
        options: ['Fazer Reserva', 'Ver Cardápio Online']
      });
    }, 1000);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string = inputText) => {
    if (!text.trim()) return;

    addMessage({ sender: 'user', text, type: 'text' });
    setInputText('');
    processStep(text);
  };

  const processStep = (input: string) => {
    if (step === 0) {
      if (input === 'Fazer Reserva' || input.toLowerCase().includes('reserva')) {
        simulateTyping(() => {
          addMessage({ sender: 'bot', text: 'Perfeito! Para começarmos, como posso chamá-lo(a)?' });
          setStep(1);
        });
      } else {
        simulateTyping(() => {
          addMessage({ sender: 'bot', text: 'No momento, estou configurado apenas para realizar reservas. Deseja fazer uma reserva?', type: 'options', options: ['Fazer Reserva'] });
        });
      }
    } 
    else if (step === 1) {
      setUserData(prev => ({ ...prev, name: input }));
      simulateTyping(() => {
        addMessage({ sender: 'bot', text: `Muito prazer, ${input}! Para qual dia você gostaria de reservar? (Ex: 15/10, Sábado, etc.)` });
        setStep(2);
      });
    }
    else if (step === 2) {
      setUserData(prev => ({ ...prev, date: input }));
      simulateTyping(() => {
        addMessage({ sender: 'bot', text: `Deixe-me verificar a disponibilidade para o dia ${input}...` });
        
        simulateTyping(() => {
          addMessage({ sender: 'bot', text: 'Temos mesas disponíveis! Em qual horário você prefere?', type: 'time-picker' });
          setStep(3);
        }, 1500);
      }, 500);
    }
    else if (step === 3) {
      setUserData(prev => ({ ...prev, time: input }));
      simulateTyping(() => {
        addMessage({ sender: 'bot', text: 'Ótimo. O Romã possui mesas de 4 lugares. Quantas pessoas estarão com você?', type: 'people-picker' });
        setStep(4);
      });
    }
    else if (step === 4) {
      // Handled directly by the people picker button
    }
  };

  const handlePeopleConfirm = (people: number) => {
    addMessage({ sender: 'user', text: `${people} pessoa(s)` });
    setUserData(prev => ({ ...prev, people }));
    
    simulateTyping(() => {
      const mesasNecessarias = Math.ceil(people / 4);
      let text = `Perfeito! Acomodaremos vocês em ${mesasNecessarias} mesa(s).\n\n`;
      text += `*Resumo da Reserva:*\n`;
      text += `👤 Nome: ${userData.name}\n`;
      text += `📅 Data: ${userData.date}\n`;
      text += `⏰ Horário: ${userData.time}\n`;
      text += `👥 Pessoas: ${people}\n\n`;
      text += `O valor da reserva é R$ 100,00. Para confirmarmos, é necessário o pagamento de 50% de sinal (*R$ 50,00*). O restante será pago no restaurante.\n\nClique abaixo para enviar seus dados e realizar o pagamento pelo WhatsApp.`;
      
      addMessage({ sender: 'bot', text, type: 'checkout' });
      setStep(5);
    }, 2000);
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'options':
        return (
          <>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            <div className="options-container">
              {msg.options?.map((opt, i) => {
                if (opt === 'Ver Cardápio Online') {
                  return (
                    <a key={i} href="https://cardapiodigitalroma.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex' }}>
                      <button className="option-btn" style={{ flex: 1 }}>
                        {opt}
                      </button>
                    </a>
                  );
                }
                return (
                  <button key={i} className="option-btn" onClick={() => handleSend(opt)}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        );
      case 'date-picker':
        return (
          <>
            <div>{msg.text}</div>
            <div className="date-picker-container">
              {getDates().map((d, i) => (
                <div key={i} className="date-btn" onClick={() => handleSend(d.date)}>
                  <span className="date-day">{d.day}</span>
                  <span className="date-weekday">{d.weekday}</span>
                </div>
              ))}
            </div>
          </>
        );
      case 'time-picker':
        return (
          <>
            <div>{msg.text}</div>
            <div className="options-container" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {['18:30', '19:30', '20:00', '21:30'].map((time, i) => (
                <button key={i} className="time-btn" onClick={() => handleSend(time)}>
                  {time}
                </button>
              ))}
            </div>
          </>
        );
      case 'people-picker':
        return (
          <>
            <div>{msg.text}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="number-input-container">
                <button className="number-btn" onClick={() => setUserData(p => ({ ...p, people: Math.max(1, p.people - 1) }))}><Minus size={18} /></button>
                <span className="number-val">{userData.people}</span>
                <button className="number-btn" onClick={() => setUserData(p => ({ ...p, people: Math.min(60, p.people + 1) }))}><Plus size={18} /></button>
              </div>
              <button 
                className="checkout-btn" 
                style={{ marginTop: 16, width: 'auto', padding: '8px 24px' }}
                onClick={() => handlePeopleConfirm(userData.people)}
              >
                Confirmar
              </button>
            </div>
          </>
        );
      case 'checkout':
        const wppText = `Olá! Gostaria de confirmar minha reserva no Restaurante Romã.%0A%0A*Nome:* ${userData.name}%0A*Data:* ${userData.date}%0A*Horário:* ${userData.time}%0A*Pessoas:* ${userData.people}%0A%0A*Valor Sinal:* R$ 50,00`;
        const wppLink = `https://wa.me/5512987045535?text=${wppText}`;
        return (
          <>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            <a href={wppLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="checkout-btn">
                Enviar Reserva <ArrowRight size={18} />
              </button>
            </a>
          </>
        );
      default:
        return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>;
    }
  };

  return (
    <div className="app-container">
      <div className="chat-bg"></div>
      
      <header className="header">
        <div className="avatar"></div>
        <div className="header-info">
          <div className="header-name">Restaurante Romã</div>
          <div className="header-status">online</div>
        </div>
        <Search size={20} color="var(--text-muted)" style={{ marginRight: 16 }} />
        <MoreVertical size={20} color="var(--text-muted)" />
      </header>

      <main className="messages-container">
        <div style={{ textAlign: 'center', margin: '10px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          HOJE
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            <div className="message">
              {renderMessageContent(msg)}
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="input-area">
        <Plus size={24} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
        <input 
          type="text" 
          className="chat-input"
          placeholder={step === 0 || step === 3 || step === 4 || step === 5 ? "Selecione uma opção acima" : "Digite uma mensagem..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isTyping || step === 0 || step === 3 || step === 4 || step === 5}
        />
        <button 
          className="send-btn" 
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isTyping || step === 0 || step === 3 || step === 4 || step === 5}
        >
          <Send size={18} />
        </button>
      </footer>
    </div>
  );
}

export default App;
