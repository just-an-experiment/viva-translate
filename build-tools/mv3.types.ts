export type Manifest = {
  // Required
  manifest_version: 3;
  name: string;
  version: string;

  // Recommended
  action: {
    default_icon: Record<string, string>;
    default_title: string;
    default_popup: string;
  };
  default_locale: string;
  description:string;
  icons: Record<string, string>;

  // Optional
  author: string;
  automation: unknown;
  background: {
    // Required
    service_worker: string;
    // Optional
    type?: string;
  };
  chrome_settings_overrides: Record<string, unknown>;
  chrome_url_overrides: Record<string, unknown>;
  commands: Record<string, unknown>;
  content_capabilities: unknown;
  content_scripts: Record<string, unknown>[];
  content_security_policy: Record<string, unknown>;
  converted_from_user_script: unknown;
  cross_origin_embedder_policy: Record<string, unknown>;
  cross_origin_opener_policy: Record<string, unknown>;
  current_locale: unknown;
  declarative_net_request: unknown;
  devtools_page: string;
  differential_fingerprint: unknown;
  event_rules: Record<string, unknown>[];
  externally_connectable: {
    matches: string[];
    ids: string[];
    accept_tls_channel_id: boolean;
  };
  file_browser_handlers: Record<string, unknown>[];
  file_system_provider_capabilities: {
    configurable: boolean;
    multiple_mounts: boolean;
    source: string;
  };
  homepage_url: string;
  host_permissions: string[];
  import: Record<string, unknown>[];
  incognito: 'spanning' | 'split' | 'not_allowed';
  input_components: unknown;
  key: string;
  minimum_chrome_version: string;
  nacl_modules: Record<string, unknown>[];
  natively_connectable: unknown;
  oauth2: unknown;
  offline_enabled: boolean;
  omnibox: {
    keyword: string;
  };
  optional_permissions: string[];
  options_page: string;
  options_ui: {
    chrome_style: boolean;
    page: string;
  };
  permissions: string[];
  platforms: unknown;
  replacement_web_app: unknown;
  requirements: Record<string, unknown>;
  sandbox: Record<string, unknown>;
  short_name: string;
  storage: {
    managed_schema: string;
  };
  system_indicator: unknown;
  tts_engine: Record<string, unknown>;
  update_url: string;
  version_name: string;
  web_accessible_resources: Record<string, unknown>[];
};
