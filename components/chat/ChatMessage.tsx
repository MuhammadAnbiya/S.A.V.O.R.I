'use client';

import ChartRenderer from "./ChartRenderer";

export default function ChatMessage({ message }: { message: any }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      <div 
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-primary text-white rounded-br-sm' 
            : 'bg-white border border-border shadow-sm text-text-primary rounded-bl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        
        {!isUser && message.chartData && message.chartType !== 'text' && (
          <ChartRenderer chartType={message.chartType} data={message.chartData} />
        )}
      </div>
      
      <span className="text-[10px] text-text-secondary mt-1 mx-1">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
