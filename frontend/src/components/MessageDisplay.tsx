import React from 'react';

interface MessageProps {
  text: string;
  type: 'success' | 'error' | 'info';
}

const MessageDisplay: React.FC<MessageProps> = ({ text, type }) => {
  if (!text) return null;

  return (
    <div className={`message ${type}`}>
      {text}
    </div>
  );
};

export default MessageDisplay;