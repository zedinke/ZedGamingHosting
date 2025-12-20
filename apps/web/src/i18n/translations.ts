// Mock translation utility
// Replaces next-intl for now
const translations: Record<string, Record<string, string>> = {
  'auth.login': {
    title: 'Sign In',
    email: 'Email Address',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In',
    noAccount: "Don't have an account?",
    signUp: 'Sign Up',
  },
  'auth.forgotPassword': {
    title: 'Forgot Password',
    email: 'Email Address',
    sendReset: 'Send Reset Link',
    backToLogin: 'Back to Login',
  },
  'auth.resetPassword': {
    title: 'Reset Password',
    password: 'New Password',
    confirmPassword: 'Confirm Password',
    reset: 'Reset Password',
    backToLogin: 'Back to Login',
  },
};

export function useTranslations(namespace?: string) {
  // Return a function that takes a key and returns a string
  return (key: string, defaultValue?: string | Record<string, unknown>): string => {
    if (namespace && translations[namespace]) {
      return translations[namespace][key] || (typeof defaultValue === 'string' ? defaultValue : key);
    }
    return typeof defaultValue === 'string' ? defaultValue : key;
  };
}

export function useLocale() {
  return 'en';
}
