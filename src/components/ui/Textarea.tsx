import { forwardRef, TextareaHTMLAttributes, useId } from 'react';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  error?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', label, helperText, errorText, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            form-textarea
            ${error ? 'form-input-error' : ''}
            ${className}
          `.trim()}
          {...props}
        />
        {error && errorText && (
          <p className="text-sm text-red-600">{errorText}</p>
        )}
        {!error && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
