// src/content/content.ts

interface SearchState {
  query: string;
  matches: Range[];
  currentIndex: number;
  highlightColor: string;
}

const state: SearchState = {
  query: '',
  matches: [],
  currentIndex: -1,
  highlightColor: '#ffff00',
};

const MARK_CLASS = 'text-search-mark';
const ACTIVE_CLASS = 'text-search-mark-active';

// --- Core: find all text matches in the page ---
function findMatches(query: string): Range[] {
  clearHighlights();
  if (!query.trim()) return [];

  const ranges: Range[] = [];
  const lowerQuery = query.toLowerCase();
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip our own injected elements and script/style
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'mark'].includes(tag))
          return NodeFilter.FILTER_REJECT;
        if (parent.classList.contains(MARK_CLASS))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    const lowerText = text.toLowerCase();
    let start = 0;

    while (true) {
      const idx = lowerText.indexOf(lowerQuery, start);
      if (idx === -1) break;

      const range = document.createRange();
      range.setStart(textNode, idx);
      range.setEnd(textNode, idx + query.length);
      ranges.push(range);

      start = idx + query.length;
    }
  }

  return ranges;
}

// --- Wrap matches in <mark> elements ---
function applyHighlights() {
  // Clear first
  clearHighlights();

  for (const range of state.matches) {
    const mark = document.createElement('mark');
    mark.className = MARK_CLASS;
    mark.style.backgroundColor = state.highlightColor;
    mark.style.color = 'inherit';
    mark.style.padding = '0 1px';
    mark.style.borderRadius = '2px';

    try {
      range.surroundContents(mark);
    } catch {
      // Range crosses element boundaries — skip gracefully
    }
  }
}

function clearHighlights() {
  const marks = document.querySelectorAll(`mark.${MARK_CLASS}`);
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
  state.matches = [];
  state.currentIndex = -1;
}

// --- Scroll to a specific match ---
function scrollToMatch(index: number) {
  const marks = document.querySelectorAll(`mark.${MARK_CLASS}`);
  // Remove active class from all
  marks.forEach((m) => m.classList.remove(ACTIVE_CLASS));

  if (index >= 0 && index < marks.length) {
    state.currentIndex = index;
    const target = marks[index];
    target.classList.add(ACTIVE_CLASS);
    target.style.outline = '2px solid #333';
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// --- Get the text of a specific match ---
function getMatchText(index: number): string {
  const marks = document.querySelectorAll(`mark.${MARK_CLASS}`);
  if (index >= 0 && index < marks.length) {
    return marks[index].textContent || '';
  }
  return '';
}

// --- Copy all matches to clipboard ---
async function copyAllMatches(): Promise<number> {
  const marks = document.querySelectorAll(`mark.${MARK_CLASS}`);
  const text = Array.from(marks).map((m) => m.textContent || '').join('\n');
  if (text) {
    await navigator.clipboard.writeText(text);
  }
  return marks.length;
}

// --- Update highlight color on all marks ---
function setHighlightColor(color: string) {
  state.highlightColor = color;
  const marks = document.querySelectorAll(`mark.${MARK_CLASS}`);
  marks.forEach((m) => (m.style.backgroundColor = color));
}

// --- Listen for messages from the popup ---
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'SEARCH':
      state.query = msg.query;
      state.matches = findMatches(msg.query);
      applyHighlights();
      sendResponse({ count: state.matches.length });
      break;

    case 'NEXT':
      scrollToMatch((state.currentIndex + 1) % state.matches.length);
      sendResponse({ index: state.currentIndex });
      break;

    case 'PREV':
      scrollToMatch(
        state.currentIndex <= 0
          ? state.matches.length - 1
          : state.currentIndex - 1
      );
      sendResponse({ index: state.currentIndex });
      break;

    case 'CLEAR':
      clearHighlights();
      sendResponse({ count: 0 });
      break;

    case 'SET_COLOR':
      setHighlightColor(msg.color);
      chrome.storage.local.set({ highlightColor: msg.color });
      sendResponse({ ok: true });
      break;

    case 'COPY_ALL':
      copyAllMatches().then((count) => sendResponse({ count }));
      return true; // async response

    case 'GET_MATCH_TEXT':
      sendResponse({ text: getMatchText(msg.index) });
      break;
  }
});

// --- Restore saved color on load ---
chrome.storage.local.get('highlightColor').then((res) => {
  if (res.highlightColor) state.highlightColor = res.highlightColor;
});   