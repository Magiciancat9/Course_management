import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
(globalThis as Record<string, unknown>).localStorage = localStorageMock;

describe('CoursePMS Client UI Component Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders login view when unauthenticated and validates empty credentials', async () => {
    render(<App />);
    expect(screen.getByText('Sign In to CoursePMS')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-submit'));
    });
    expect(screen.getByTestId('auth-error')).toHaveTextContent(
      'Email and password are required.'
    );
  });

  it('populates login inputs when clicking quick-fill demo account buttons', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('quickfill-pawarit'));
    expect(screen.getByTestId('login-email')).toHaveValue('pawarit@mail.kmutt.ac.th');
    expect(screen.getByTestId('login-password')).toHaveValue('Password123!');
  });

  it('disables login while the request is pending and restores the session after success', async () => {
    const user = {
      id: 1,
      email: 'pawarit@mail.kmutt.ac.th',
      fullName: 'Pawarit Wongdaeng',
      studentCode: '67070503466',
      role: 'STUDENT' as const,
    };
    let resolveLogin!: (response: Response) => void;
    const loginResponse = new Promise<Response>((resolve) => {
      resolveLogin = resolve;
    });
    const response = (body: unknown, status = 200) =>
      ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
      }) as Response;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const path = String(input);
        if (path.endsWith('/api/auth/login')) return loginResponse;
        if (path.endsWith('/api/auth/me')) return Promise.resolve(response({ user }));
        if (path.endsWith('/api/courses')) return Promise.resolve(response({ courses: [] }));
        if (path.endsWith('/api/teams')) return Promise.resolve(response({ teams: [] }));
        if (path.endsWith('/api/auth/logout')) {
          return Promise.resolve(
            response({ error: 'Logout unavailable.', code: 'LOGOUT_FAILED' }, 503)
          );
        }
        return Promise.resolve(response({}));
      })
    );

    render(<App />);
    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: user.email },
    });
    fireEvent.change(screen.getByTestId('login-password'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByTestId('login-submit'));

    expect(screen.getByTestId('login-submit')).toBeDisabled();
    expect(screen.getByTestId('login-submit')).toHaveTextContent('Signing in');

    await act(async () => {
      resolveLogin(response({ token: 'test-token', user }));
      await loginResponse;
    });

    expect(await screen.findByTestId('current-user-role')).toHaveTextContent('STUDENT');
    expect(window.localStorage.getItem('course_pms_token')).toBe('test-token');
    expect(screen.getByText('No project teams are available in this course yet.')).toBeInTheDocument();
    expect(screen.getByTestId('create-team-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(await screen.findByTestId('error-banner')).toHaveTextContent('LOGOUT_FAILED');
    expect(screen.getByTestId('current-user-role')).toHaveTextContent('STUDENT');
    expect(screen.queryByText('Logged out successfully. Session token revoked.')).not.toBeInTheDocument();
  });

  it('shows network errors and lets the user dismiss the alert', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<App />);
    fireEvent.change(screen.getByTestId('login-email'), {
      target: { value: 'pawarit@mail.kmutt.ac.th' },
    });
    fireEvent.change(screen.getByTestId('login-password'), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('auth-error')).toHaveTextContent('NETWORK_ERROR');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument();
  });
});
