/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google Identity Services (GIS) type declarations
interface CredentialResponse {
  credential: string;
  select_by: string;
  clientId?: string;
}

interface GsiButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface IdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  login_uri?: string;
  native_callback?: (response: CredentialResponse) => void;
  cancel_on_tap_outside?: boolean;
  prompt_parent_id?: string;
  nonce?: string;
  context?: string;
  state_cookie_domain?: string;
  ux_mode?: "popup" | "redirect";
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: () => void;
  itp_support?: boolean;
  login_hint?: string;
  hd?: string;
  use_fedcm_for_prompt?: boolean;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  hd?: string;
  prompt: string;
  token_type: string;
  scopes: string;
  state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface TokenClientConfig {
  client_id: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: any) => void;
  scope?: string;
  prompt?: string;
  state?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: any) => void;
}

interface Google {
  accounts: {
    id: {
      initialize: (config: IdConfiguration) => void;
      prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean; getMomentType: () => string; getDismissedReason: () => string; getNotDisplayedReason: () => string; getSkippedReason: () => string }) => void) => void;
      renderButton: (parent: HTMLElement, config: GsiButtonConfiguration) => void;
      disableAutoSelect: () => void;
      storeCredential: (credential: { id: string; password: string }, callback?: () => void) => void;
      cancel: () => void;
      revoke: (hint: string, callback?: (response: { successful: boolean; error: string }) => void) => void;
    };
    oauth2: {
      initTokenClient: (config: TokenClientConfig) => TokenClient;
    };
  };
}

declare const google: Google;
