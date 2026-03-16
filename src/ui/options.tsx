import React from 'react';
import { createRoot } from 'react-dom/client';

function Options() {
  return (
    <div>
      <h1>ContextPilot Options</h1>
      <p>Settings will be available here.</p>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
