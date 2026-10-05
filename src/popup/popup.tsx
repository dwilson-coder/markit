// src/popup/popup.tsx
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Helper: send a message to the content script
function sendToTab(message: Record<string, unknown>) {
  return chrome.tabs.query({ active: true, currentWindow: true }).then(
    ([tab]) => {
      if (!tab?.id) return Promise.reject('No active tab');
      return chrome.tabs.sendMessage(tab.id, message);
    }
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);
  const [color, setColor] = useState('#ffff00');

  // Load saved color
  useEffect(() => {
    chrome.storage.local.get('highlightColor').then((res) => {
      if (res.highlightColor) setColor(res.highlightColor);
    });
  }, []);

  const doSearch = async () => {
    if (!query.trim()) return;
    const res = await sendToTab({ type: 'SEARCH', query });
    setCount(res.count);
  };

  const goNext = async () => {
    await sendToTab({ type: 'NEXT' });
  };

  const goPrev = async () => {
    await sendToTab({ type: 'PREV' });
  };

  const clearAll = async () => {
    await sendToTab({ type: 'CLEAR' });
    setCount(0);
  };

  const copyAll = async () => {
    const res = await sendToTab({ type: 'COPY_ALL' });
    alert(`Copied ${res.count} match(es) to clipboard!`);
  };

  const onColorChange = (c: string) => {
    setColor(c);
    sendToTab({ type: 'SET_COLOR', color: c });
  };

  const hasMatches = count > 0;

  return (
    <>
      <div className="row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          placeholder="Search this page…"
        />
        <button onClick={doSearch}>Go</button>
      </div>

      <div className="count">
        {hasMatches ? `${count} match(es) found` : 'No search yet'}
      </div>

      <div className="controls">
        <button onClick={goPrev} disabled={!hasMatches}>↑ Prev</button>
        <button onClick={goNext} disabled={!hasMatches}>↓ Next</button>
        <button onClick={clearAll} disabled={!hasMatches}>✕ Clear</button>
      </div>

      <div className="color-row">
        <label>Highlight:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
        />
      </div>

      <div className="copy-row">
        <button onClick={copyAll} disabled={!hasMatches}>
          📋 Copy All Matches
        </button>
      </div>
    </>
  );
}

const root = createRoot(document.body);
root.render(<App />);   