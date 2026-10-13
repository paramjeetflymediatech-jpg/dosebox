// Fallback declarations for libraries if module resolution in IDE Language Server has caching issues

declare module '@react-oauth/google' {
  export const GoogleOAuthProvider: React.ComponentType<{
    clientId: string;
    children?: React.ReactNode;
    onScriptLoadSuccess?: () => void;
    onScriptLoadError?: () => void;
  }>;

  export const GoogleLogin: React.ComponentType<{
    onSuccess?: (credentialResponse: any) => void;
    onError?: () => void;
    promptMomentNotification?: (promptMoment: any) => void;
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: string | number;
    locale?: string;
    ux_mode?: 'popup' | 'redirect';
    login_uri?: string;
    auto_select?: boolean;
    useOneTap?: boolean;
  }>;

  export function useGoogleLogin(options: any): any;
  export function useGoogleOneTapLogin(options: any): any;
  export function googleLogout(): void;
}

declare module '@tanstack/react-query' {
  import React from 'react';

  export class QueryClient {
    constructor(config?: any);
    mount(): void;
    unmount(): void;
    clear(): void;
    getQueryData(queryKey: any): any;
    setQueryData(queryKey: any, updater: any): any;
    invalidateQueries(filters?: any): Promise<void>;
  }

  export const QueryClientProvider: React.ComponentType<{
    client: QueryClient;
    children?: React.ReactNode;
  }>;

  export function useQueryClient(): QueryClient;
  export function useQuery<T = any>(options: any): any;
  export function useMutation<T = any>(options: any): any;
}

