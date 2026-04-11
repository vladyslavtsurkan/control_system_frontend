export type AuthMethod = "anonymous" | "username";

export type SecurityPolicy =
  | "Aes256_Sha256_RsaPss"
  | "Aes128_Sha256_RsaOaep"
  | "Basic256Sha256"
  | "None"
  | "Basic256"
  | "Basic128Rsa15";

export interface OpcServer {
  id: string;
  created_at: string;
  organization_id: string;
  name: string;
  description: string | null;
  url: string;
  security_policy: SecurityPolicy;
  authentication_method: AuthMethod;
  username: string | null;
}

export interface CreateOpcServerRequest {
  name: string;
  description?: string | null;
  url: string;
  security_policy?: SecurityPolicy;
  authentication_method?: AuthMethod;
  username?: string | null;
  password?: string | null;
}

export interface UpdateOpcServerRequest {
  id: string;
  name?: string | null;
  description?: string | null;
  url?: string | null;
  security_policy?: SecurityPolicy | null;
  authentication_method?: AuthMethod | null;
  username?: string | null;
  password?: string | null;
}

export interface ApiKeyCreateResponse {
  key_id: string;
  secret_key: string;
  created_at: string;
}

export interface ApiKeyInfoResponse {
  id: string;
  created_at: string;
  opc_server_id: string;
  key_id: string;
  last_used_at: string | null;
  updated_at: string;
}
