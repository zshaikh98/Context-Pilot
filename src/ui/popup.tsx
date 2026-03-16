import React from 'react';
import { createRoot } from 'react-dom/client';

function Popup() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: '0 0 8px' }}>ContextPilot</h2>
      <p style={{ color: '#555', fontSize: 14 }}>ContextPilot running.</p>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
