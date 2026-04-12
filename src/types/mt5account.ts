export type MT5AccountStatus = 'connecting' | 'connected' | 'syncing' | 'error';

export type MT5Account = {
  id: string;
  login: string;        // login number
  server: string;       // broker server name
  firm: string;         // auto-detected from server
  balance: number;
  equity: number;
  currency: string;
  accountType: 'demo' | 'live';
  status: MT5AccountStatus;
  lastSync: string | null;   // ISO timestamp
  errorMessage?: string;
  metaApiAccountId?: string; // MetaAPI cloud account ID
  metaApiRegion?: string;    // MetaAPI region (e.g. 'new-york')
};
