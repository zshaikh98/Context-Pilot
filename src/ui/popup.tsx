import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, UsageStore, DEFAULT_SETTINGS } from '../shared/storage';
import { SiteKey, SITES, detectSiteFromUrl } from '../shared/sites';

interface ConversationState {
  site: SiteKey;
  tokenCount: number;
  model: string | null;
  messages: { role: string; text: string }[];
}

function Popup() {
  const [site, setSite] = useState<SiteKey | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [usage, setUsage] = useState<UsageStore>([]);
  const [conversation, setConversation] = useState<ConversationState | null>(null);

  useEffect(() => {
    // Detect current site from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        const detected = detectSiteFromUrl(tab.url);
        setSite(detected);

        // Get current conversation state
        if (tab.id != null) {
          chrome.runtime.sendMessage(
            { type: 'GET_CURRENT_CONVERSATION', tabId: tab.id },
            (resp) => {
              if (resp) setConversation(resp);
            },
          );
        }
      }

      // Load settings and usage
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (resp) => {
        if (resp) setSettings(resp);
      });
      chrome.runtime.sendMessage({ type: 'GET_USAGE' }, (resp) => {
        if (resp) setUsage(resp);
      });
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayUsage = site
    ? usage.filter((e) => e.site === site && e.date === today)
    : [];
  const todayTokens = todayUsage.reduce((sum, e) => sum + e.tokensInput, 0);

  const costRate = settings.global.defaultCostPerMillionTokens;
  const convTokens = conversation?.tokenCount ?? 0;
  const convCost = (convTokens / 1_000_000) * costRate;
  const dayCost = (todayTokens / 1_000_000) * costRate;

  const siteConfig = site ? SITES[site] : null;
  const warnThreshold = site ? settings.sites[site].warnThresholdTokens : 0;
  const showWarning = convTokens > warnThreshold && warnThreshold > 0;

  return (
    <div style={{ padding: 16, fontSize: 13, minHeight: 180 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>ContextPilot</h2>

      <div style={{ marginBottom: 12 }}>
        <div style={labelStyle}>Site</div>
        <div style={valueStyle}>{siteConfig?.label ?? 'Not on a supported site'}</div>
      </div>

      {site && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Model</div>
            <div style={valueStyle}>{conversation?.model ?? 'Unknown model'}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Current conversation</div>
            <div style={valueStyle}>
              ~{convTokens.toLocaleString()} tokens
              {convCost > 0.001 && (
                <span style={{ color: '#888', marginLeft: 6 }}>
                  (~${convCost.toFixed(4)})
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={labelStyle}>Today's total ({siteConfig?.label})</div>
            <div style={valueStyle}>
              ~{todayTokens.toLocaleString()} tokens
              {dayCost > 0.001 && (
                <span style={{ color: '#888', marginLeft: 6 }}>
                  (~${dayCost.toFixed(4)})
                </span>
              )}
            </div>
          </div>

          {showWarning && (
            <div style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '8px 10px',
              borderRadius: 6,
              fontSize: 12,
            }}>
              You've sent ~{convTokens.toLocaleString()} tokens — consider
              summarizing old messages to reduce usage.
            </div>
          )}
        </>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 2,
};

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<Popup />);
}
