// utils/sanitizeInput.ts
export const sanitizeInput = (input: string): string => {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>\/;]/g, '') // Remove <, >, /, and ;
      .replace(/['"`]/g, '')   // Remove quotes
      .replace(/[\[\]{}]/g, '') // Remove brackets
      .trim();                  // Remove leading/trailing whitespace
  };
  
  // Optional: If you want to sanitize while preserving some formatting
  export const safeSanitizeInput = (input: string): string => {
    // Encode special characters instead of removing them
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };
  
  // Function to sanitize form values
  export const sanitizeFormValues = <T extends object>(values: T): T => {
    const sanitized = { ...values };
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitizeInput(sanitized[key] as string) as any;
      }
    }
    return sanitized;
  };