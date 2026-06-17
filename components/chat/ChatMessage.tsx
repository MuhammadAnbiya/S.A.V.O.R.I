'use client';

import ChartRenderer from './ChartRenderer';

export default function ChatMessage({ message }: { message: any }) {
  const isUser = message.role === 'user';

  const hasChart =
    !isUser &&
    message.chartData &&
    Array.isArray(message.chartData) &&
    message.chartData.length > 0 &&
    message.chartType &&
    message.chartType !== 'text';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '0.625rem 0.875rem',
          borderRadius: '0.75rem',
          borderBottomRightRadius: isUser ? '0.25rem' : '0.75rem',
          borderBottomLeftRadius: isUser ? '0.75rem' : '0.25rem',
          backgroundColor: isUser ? '#cc785c' : '#ffffff',
          color: isUser ? '#ffffff' : '#141413',
          border: isUser ? 'none' : '1px solid #e6dfd8',
          boxShadow: isUser ? 'none' : '0 1px 4px rgba(20,20,19,0.06)',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
        }}
      >
        <p
          style={{
            fontSize: '0.9375rem',
            lineHeight: 1.55,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </p>

        {/* Only render chart if we have valid chart data */}
        {hasChart && (
          <ChartRenderer chartType={message.chartType} data={message.chartData} />
        )}
      </div>

      {/* Timestamp */}
      <span
        style={{
          fontSize: '0.6875rem',
          color: '#8e8b82',
          marginTop: '0.25rem',
          marginLeft: isUser ? 0 : '0.25rem',
          marginRight: isUser ? '0.25rem' : 0,
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
        }}
      >
        {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
