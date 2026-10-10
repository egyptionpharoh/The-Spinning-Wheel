import React, { useMemo } from 'react';

interface StudentImporterProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export const StudentImporter: React.FC<StudentImporterProps> = ({ value, onChange, error }) => {
  const studentCount = useMemo(() => {
    return value.split('\n').filter(name => name.trim().length > 0).length;
  }, [value]);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor="studentsList">
        Students List 
        {studentCount > 0 && <span className="student-counter">{studentCount}</span>}
      </label>
      <textarea
        id="studentsList"
        className="form-textarea"
        placeholder="Paste student names here...&#10;One name per line&#10;Example:&#10;Ahmed Ali&#10;Omar Khaled&#10;Sara Tarek"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
      />
      {error && <p className="form-error">{error}</p>}
      <p className="form-label" style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
        Paste from Excel, Word, or type manually.
      </p>
    </div>
  );
};