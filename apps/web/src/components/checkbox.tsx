'use client';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled, className = '' }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 rounded border-2 cursor-pointer"
        style={{
          backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
          borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
          accentColor: 'var(--color-primary)',
        }}
      />
      {label && (
        <span style={{ color: '#f8fafc' }}>{label}</span>
      )}
    </label>
  );
}

