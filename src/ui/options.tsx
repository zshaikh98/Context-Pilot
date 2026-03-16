import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, getSettings, saveSettings, DEFAULT_SETTINGS } from '../shared/storage';
import { SiteKey, SITES } from '../shared/sites';

const SITE_KEYS: SiteKey[] = ['perplexity', 'chatgpt', 'claude'];

function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const updateSite = (site: SiteKey, field: string, value: boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      sites: {
        ...prev.sites,
        [site]: { ...prev.sites[site], [field]: value },
      },
    }));
    setSaved(false);
  };

  const updateGlobal = (field: string, value: number | string) => {
    setSettings((prev) => ({
      ...prev,
      global: { ...prev.global, [field]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>ContextPilot Options</h1>

      {SITE_KEYS.map((site) => (
        <fieldset key={site} style={fieldsetStyle}>
          <legend style={legendStyle}>{SITES[site].label}</legend>

          <label style={rowStyle}>
            <span>Enabled</span>
            <input
              type="checkbox"
              checked={settings.sites[site].enabled}
              onChange={(e) => updateSite(site, 'enabled', e.target.checked)}
            />
          </label>

          <label style={rowStyle}>
            <span>Warn threshold (tokens)</span>
            <input
              type="number"
              value={settings.sites[site].warnThresholdTokens}
              onChange={(e) => updateSite(site, 'warnThresholdTokens', Number(e.target.value))}
              style={inputStyle}
              min={0}
              step={1000}
            />
          </label>

          <label style={rowStyle}>
            <span>History depth (messages to keep)</span>
            <input
              type="number"
              value={settings.sites[site].historyDepthMessages}
              onChange={(e) => updateSite(site, 'historyDepthMessages', Number(e.target.value))}
              style={inputStyle}
              min={1}
              max={100}
            />
          </label>
        </fieldset>
      ))}

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Global</legend>

        <label style={rowStyle}>
          <span>Cost per 1M tokens ($)</span>
          <input
            type="number"
            value={settings.global.defaultCostPerMillionTokens}
            onChange={(e) => updateGlobal('defaultCostPerMillionTokens', Number(e.target.value))}
            style={inputStyle}
            min={0}
            step={0.1}
          />
        </label>

        <label style={rowStyle}>
          <span>Theme</span>
          <select
            value={settings.global.theme}
            onChange={(e) => updateGlobal('theme', e.target.value)}
            style={inputStyle}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </fieldset>

      <button onClick={handleSave} style={buttonStyle}>
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

const fieldsetStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '12px 16px',
  marginBottom: 16,
};

const legendStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  padding: '0 8px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  width: 120,
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid #ccc',
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: '#4f46e5',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 8,
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<Options />);
}
