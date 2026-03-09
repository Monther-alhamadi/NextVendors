import React from 'react';
import PropTypes from 'prop-types';

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  className = "",
  containerClassName = "",
  id,
  helpText, // Destructure to prevent passing to DOM
  ...props
}, ref) => {
  const generatedId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`input-container ${containerClassName}`}>
      {label && (
        <label htmlFor={generatedId} className="input-label">
          {label}
        </label>
      )}
      
      <div className="input-wrapper">
        {startIcon && (
          <span className="input-icon start-icon">
            {startIcon}
          </span>
        )}
        
        {props.multiline ? (
          <textarea
            ref={ref}
            id={generatedId}
            className={`
              input-field 
              ${error ? 'input-error' : ''} 
              ${startIcon ? 'has-start-icon' : ''} 
              ${endIcon ? 'has-end-icon' : ''} 
              ${className}
            `}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={generatedId}
            className={`
              input-field 
              ${error ? 'input-error' : ''} 
              ${startIcon ? 'has-start-icon' : ''} 
              ${endIcon ? 'has-end-icon' : ''} 
              ${className}
            `}
            {...props}
          />
        )}
        
        {endIcon && (
          <span className="input-icon end-icon">
            {endIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="input-message error-message">{error}</p>
      ) : helperText ? (
        <p className="input-message helper-message">{helperText}</p>
      ) : null}

      <style jsx>{`
        .input-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 0px;
          width: 100%;
        }

        .input-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-field {
          width: 100%;
          padding: 10px 12px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-family: var(--font-body);
          color: var(--text-main);
          transition: all 0.2s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(197, 160, 101, 0.15);
        }

        .input-field.input-error {
          border-color: var(--danger);
        }
        
        .input-field.input-error:focus {
           box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        /* Logical properties for icons */
        .input-icon {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          pointer-events: none;
          height: 100%;
          padding-inline: 12px;
        }

        .start-icon {
          inset-inline-start: 0;
        }

        .end-icon {
          inset-inline-end: 0;
        }

        .has-start-icon {
          padding-inline-start: 40px;
        }

        .has-end-icon {
          padding-inline-end: 40px;
        }

        .input-message {
          font-size: 0.8rem;
          margin: 0;
        }

        .error-message {
          color: var(--danger);
        }

        .helper-message {
          color: var(--text-secondary);
        }

        .input-field:disabled {
          background-color: var(--bg-page);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
