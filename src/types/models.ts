// ─── Auth ────────────────────────────────────────────────────────────────────

/** LoginRequest — POST /api/v1/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** LoginResponse — returned by /auth/login and /auth/refresh-token */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

/** SignUpRequest — POST /api/v1/auth/signup */
export interface SignUpRequest {
  email: string;
  password: string; // 8–64 chars
  first_name?: string | null;
  last_name?: string | null;
}

/** SignUpResponse */
export interface SignUpResponse {
  message: string;
}

/** SignUpVerifyRequest — POST /api/v1/auth/signup/verify */
export interface SignUpVerifyRequest {
  email: string;
  code: string;
}

/** SignUpVerifyResponse — same shape as LoginResponse */
export interface SignUpVerifyResponse {
  access_token: string;
  refresh_token: string;
}

/** RefreshTokenRequest — POST /api/v1/auth/refresh-token */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/** ForgotPasswordRequest — POST /api/v1/auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** ForgotPasswordResponse */
export interface ForgotPasswordResponse {
  message: string;
}

/** ResetPasswordRequest — POST /api/v1/auth/reset-password */
export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string; // 8–64 chars
}

/** ResetPasswordResponse */
export interface ResetPasswordResponse {
  message: string;
}

/** UserResponse — GET /api/v1/users/me */
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
}

/** UserUpdateRequest — PATCH /api/v1/users/ */
export interface UserUpdateRequest {
  first_name?: string | null;
  last_name?: string | null;
}

// ─── Enums — mirrors backend enums ───────────────────────────────────────────

/** AuthMethodEnum */
export type AuthMethod = "anonymous" | "username";

/** SecurityPolicyEnum */
export type SecurityPolicy =
  | "Aes256_Sha256_RsaPss"
  | "Aes128_Sha256_RsaOaep"
  | "Basic256Sha256"
  | "None"
  | "Basic256"
  | "Basic128Rsa15";

/** AlertSeverityEnum */
export type AlertSeverity = "info" | "warning" | "critical" | "fatal";

/** Stateful WS alert lifecycle action */
export type AlertLifecycleAction = "open" | "update" | "resolve";

/** Frontend-facing alert lifecycle status */
export type AlertLifecycleStatus = "active" | "resolved";

/** AlertConditionEnum */
export type AlertCondition =
  | "greater_than"
  | "less_than"
  | "equals"
  | "not_equals"
  | "outside_range"
  | "inside_range"
  | "no_data";

/** UserRoleInOrgEnum — backend has owner | admin | member only */
export type UserRoleInOrg = "owner" | "admin" | "member";

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * PaginatedResponse<T> — matches backend shape exactly:
 * { count, per_page, total_pages, items }
 */
export interface PaginatedResponse<T> {
  count: number;
  per_page: number | null;
  total_pages: number | null;
  items: T[];
}

// ─── Organizations ────────────────────────────────────────────────────────────

/**
 * OrganizationWithRoleResponse — the only org shape returned by the backend.
 * (There is no plain "Organization" without a role.)
 */
export interface OrganizationWithRole {
  id: string;
  created_at: string; // ISO-8601
  name: string;
  description: string | null;
  role: UserRoleInOrg;
}

/** OrganizationCreateRequest */
export interface CreateOrganizationRequest {
  name: string;
  description?: string | null;
}

/** OrganizationUpdateRequest */
export interface UpdateOrganizationRequest {
  name?: string | null;
  description?: string | null;
}

/**
 * OrganizationMemberResponse — standalone shape, NOT extending User.
 * Returned by GET /organizations/{id}/members.
 */
export interface OrganizationMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
  role: UserRoleInOrg;
}

/** ChangeRoleRequest */
export interface ChangeRoleRequest {
  role: UserRoleInOrg;
}

// ─── OPC UA Servers ───────────────────────────────────────────────────────────

/** OpcServerResponse */
export interface OpcServer {
  id: string;
  created_at: string; // ISO-8601
  organization_id: string;
  name: string;
  description: string | null;
  url: string;
  security_policy: SecurityPolicy;
  authentication_method: AuthMethod;
  username: string | null;
  // password is excluded server-side — never returned
}

/** OpcServerCreateRequest */
export interface CreateOpcServerRequest {
  name: string;
  description?: string | null;
  url: string;
  security_policy?: SecurityPolicy;
  authentication_method?: AuthMethod;
  username?: string | null;
  password?: string | null;
}

/** OpcServerUpdateRequest */
export interface UpdateOpcServerRequest {
  id: string; // frontend-only — used to build the URL path
  name?: string | null;
  description?: string | null;
  url?: string | null;
  security_policy?: SecurityPolicy | null;
  authentication_method?: AuthMethod | null;
  username?: string | null;
  password?: string | null;
}

/** ApiKeyCreateResponse — secret_key shown only once */
export interface ApiKeyCreateResponse {
  key_prefix: string;
  secret_key: string;
  created_at: string; // ISO-8601
}

/** ApiKeyInfoResponse */
export interface ApiKeyInfoResponse {
  id: string;
  created_at: string;          // ISO-8601
  opc_server_id: string;
  key_prefix: string;
  last_used_at: string | null; // ISO-8601
  updated_at: string;          // ISO-8601
}

// ─── Sensors ──────────────────────────────────────────────────────────────────

/** SensorResponse */
export interface Sensor {
  id: string;
  created_at: string; // ISO-8601
  opc_server_id: string;
  name: string;
  description: string | null;
  node_id: string;
  units: string | null;
}

/** SensorCreateRequest */
export interface CreateSensorRequest {
  opc_server_id: string;
  name: string;
  description?: string | null;
  node_id: string;
  units?: string | null;
}

/** SensorUpdateRequest */
export interface UpdateSensorRequest {
  id: string; // frontend-only
  name?: string | null;
  description?: string | null;
  node_id?: string | null;
  units?: string | null;
}

// ─── Readings ─────────────────────────────────────────────────────────────────

/**
 * ReadingResponse — GET /api/v1/readings/
 * `payload` is a free-form object; numeric value is conventionally at payload.value.
 */
export interface ReadingResponse {
  sensor_id: string;
  payload: Record<string, unknown>;
  time: string; // ISO-8601
}

/** Query params for GET /api/v1/readings/ */
export interface GetReadingsParams {
  sensor_id: string;
  offset?: number;
  limit?: number;
}

/**
 * SensorReading — a flattened view used by chart components.
 * Derived from ReadingResponse by extracting payload.value.
 */
export interface SensorReading {
  time: string;  // ISO-8601
  value: number;
  sensor_id: string;
}

/** Legacy compat alias — used by WS middleware cache patching */
export interface GetSensorReadingsParams {
  sensorId: string;
  from?: string;
  to?: string;
  limit?: number;
}

// ─── Triggered Alerts ─────────────────────────────────────────────────────────

/** AlertResponse — GET /api/v1/alerts/ */
export interface Alert {
  id: string;
  created_at: string;                  // ISO-8601 (when triggered)
  updated_at?: string;                 // ISO-8601 (not guaranteed by current REST schema)
  sensor_id: string;
  rule_id: string | null;
  message: string;
  triggered_value: Record<string, unknown>;
  is_acknowledged: boolean;
  resolved_at: string | null;          // ISO-8601
}

/** Query params for GET /api/v1/alerts/ */
export interface GetAlertsParams {
  sensor_id?: string;
  offset?: number;
  limit?: number;
}

// ─── Alert Rules ──────────────────────────────────────────────────────────────

/** For greater_than | less_than | equals | not_equals */
export interface SingleValueThreshold {
  type: "single_value";
  value: number;
}

/** For outside_range | inside_range */
export interface RangeThreshold {
  type: "range";
  min: number;
  max: number;
}

/** For no_data */
export interface NoDataThreshold {
  type: "no_data";
  timeout_seconds?: number; // defaults to 300 server-side
}

/** Discriminated union matching backend Threshold */
export type Threshold = SingleValueThreshold | RangeThreshold | NoDataThreshold;

/** AlertRuleResponse */
export interface AlertRule {
  id: string;
  created_at: string; // ISO-8601
  sensor_id: string;
  name: string;
  severity: AlertSeverity;
  condition: AlertCondition;
  threshold: Threshold;
  is_active: boolean;
}

/** AlertRuleCreateRequest */
export interface CreateAlertRuleRequest {
  sensor_id: string;
  name: string;
  severity?: AlertSeverity; // defaults to "warning" server-side
  condition: AlertCondition;
  threshold: Threshold;
}

/** AlertRuleUpdateRequest */
export interface UpdateAlertRuleRequest {
  id: string; // frontend-only
  name?: string | null;
  severity?: AlertSeverity | null;
  condition?: AlertCondition | null;
  threshold?: Threshold | null;
  is_active?: boolean | null;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface WsTelemetryEvent {
  type: "telemetry";
  sensor_id: string;
  data: {
    value: number;
    time: string;
  };
}

export interface WsAlertEvent {
  type: "alert";
  sensor_id?: string;
  sensor_name?: string;
  severity?: AlertSeverity;
  message?: string;
  triggered_at?: string;
  rule_id?: string;
  // New backend shape keeps lifecycle fields under `data`.
  data?: {
    action?: AlertLifecycleAction;
    rule_id?: string;
    message?: string;
    triggered_value?: Record<string, unknown>;
  };
  // Backward-compat fields (legacy emitters may still use these paths).
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WsTicketResponse {
  ticket: string;
}

export type WsEvent = WsTelemetryEvent | WsAlertEvent;

// ─── Live / Real-time State ───────────────────────────────────────────────────

export interface LiveAlert {
  id: string;
  key: string; // canonical key: sensor_id + rule_id
  rule_id: string;
  sensor_id: string;
  sensor_name: string;
  severity: AlertSeverity;
  message: string;
  triggered_at: string;
  updated_at: string;
  resolved_at: string | null;
  action: AlertLifecycleAction;
  status: AlertLifecycleStatus;
  triggered_value: Record<string, unknown>;
}

export interface LiveKpi {
  sensor_id: string;
  value: number;
  time: string;
}
