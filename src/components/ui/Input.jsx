import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  className = '', 
  labelClassName = '',
  ...props 
}, ref) => {
  const id = `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium text-neutral-700 mb-1.5 ${labelClassName}`}>
          {label}
        </label>}
        <input
          ref={ref}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-150"
          {...props}
        />
        {props.error && <p className="mt-1.5 text-sm text-red-600">{props.error}</p>}
      </div>
    );
});

Input.displayName = 'Input';

export default Input;