import React from 'react';
import { SessionSettings } from '../../core/types/core';

interface SessionSettingsCardProps {
  settings: SessionSettings;
  onChange: (settings: SessionSettings) => void;
  spinDurationMs: number;
  onSpinDurationChange: (duration: number) => void;
}

export const SessionSettingsCard: React.FC<SessionSettingsCardProps> = ({ 
  settings, 
  onChange,
  spinDurationMs,
  onSpinDurationChange
}) => {
  const handleCheckboxChange = (key: keyof SessionSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...settings, [key]: e.target.checked });
  };

  const handleSelectChange = (key: keyof SessionSettings) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...settings, [key]: e.target.value as any });
  };

  return (
    <div className="setup-card">
      <h2 className="setup-card-title">Session Settings</h2>
      
      <div className="form-checkbox-group">
        <input 
          type="checkbox" 
          id="autoRemove" 
          className="form-checkbox"
          checked={settings.autoRemoveOnPass}
          onChange={handleCheckboxChange('autoRemoveOnPass')}
        />
        <label htmlFor="autoRemove" className="form-checkbox-label">
          Auto-remove passed students from wheel
        </label>
      </div>

      <div className="form-checkbox-group">
        <input 
          type="checkbox" 
          id="allowRepeat" 
          className="form-checkbox"
          checked={settings.allowRepeat}
          onChange={handleCheckboxChange('allowRepeat')}
        />
        <label htmlFor="allowRepeat" className="form-checkbox-label">
          Allow repeating same student
        </label>
      </div>
      <div className="form-checkbox-group" style={{ marginTop: '1.5rem' }}>
        <input 
          type="checkbox" 
          id="enableQuestions" 
          className="form-checkbox"
          checked={!!settings.enableQuestions}
          onChange={handleCheckboxChange('enableQuestions')}
        />
        <label htmlFor="enableQuestions" className="form-checkbox-label">
          Enable Question System
        </label>
      </div>

      {settings.enableQuestions && (
        <div className="form-group" style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
          <label className="form-label" htmlFor="questionTimeLimitSec">Question Time Limit</label>
          <select 
            id="questionTimeLimitSec" 
            className="form-select"
            value={settings.questionTimeLimitSec || 30}
            onChange={(e) => onChange({ ...settings, questionTimeLimitSec: parseInt(e.target.value, 10) })}
          >
            <option value="15">15 Seconds</option>
            <option value="30">30 Seconds</option>
            <option value="60">60 Seconds</option>
          </select>
        </div>
      )}

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="form-label" htmlFor="spinDuration">Spin Duration</label>
        <select 
          id="spinDuration" 
          className="form-select"
          value={spinDurationMs}
          onChange={(e) => onSpinDurationChange(parseInt(e.target.value, 10))}
        >
          <option value="1000">Quick (1 second)</option>
          <option value="3000">Normal (3 seconds)</option>
          <option value="5000">Suspense (5 seconds)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="theme">Theme</label>
        <select 
          id="theme" 
          className="form-select"
          value={settings.themeVariant}
          onChange={handleSelectChange('themeVariant')}
        >
          <option value="system">System Default</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>
    </div>
  );
};