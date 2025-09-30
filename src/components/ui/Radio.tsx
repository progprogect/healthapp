import { forwardRef, InputHTMLAttributes, useId } from 'react';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: boolean;
  className?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;
    
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={`
            form-radio
            ${error ? 'border-red-300' : ''}
            ${className}
          `.trim()}
          {...props}
        />
        {label && (
          <label htmlFor={radioId} className="ml-2 text-sm text-gray-700 cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
