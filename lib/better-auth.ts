import { auth } from './better-auth-config';

// Re-export the auth instance for use in other parts of the app
export { auth };

/**
 * Get the current user session
 * @returns Promise that resolves to the session object or null
 */
export const getSession = () => auth.getSession();