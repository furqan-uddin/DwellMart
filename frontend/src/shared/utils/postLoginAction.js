const POST_LOGIN_REDIRECT_KEY = 'post-login-redirect';
const POST_LOGIN_ACTION_KEY = 'post-login-action';

export const setPostLoginRedirect = (path) => {
  if (typeof window === 'undefined') return;
  const normalized = String(path || '/home').trim() || '/home';
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, normalized);
};

export const getPostLoginRedirect = () => {
  if (typeof window === 'undefined') return '/home';
  return sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || '/home';
};

export const clearPostLoginRedirect = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
};

export const setPostLoginAction = (action) => {
  if (typeof window === 'undefined') return;
  if (!action || typeof action !== 'object' || !action.type) return;
  sessionStorage.setItem(
    POST_LOGIN_ACTION_KEY,
    JSON.stringify({ ...action, createdAt: Date.now() })
  );
};

export const consumePostLoginAction = () => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(POST_LOGIN_ACTION_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(POST_LOGIN_ACTION_KEY);
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};
