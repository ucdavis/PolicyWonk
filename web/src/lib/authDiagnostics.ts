import { randomUUID } from 'node:crypto';

import { campuses } from './constants';

type SignInStage =
  'claims' | 'user_upsert' | 'group_assignment' | 'jwt_callback';

type SignInRecord = {
  event: 'policywonk_signin';
  schema_version: 1;
  correlation_id: string;
  campus: string;
  stage: SignInStage;
  has_eppn: boolean | null;
  has_email: boolean | null;
  has_affiliation: boolean | null;
  resolved_group: string | null;
};

type SignInDiagnostics = {
  stage: (stage: SignInStage) => void;
  claims: (presence: {
    eppn: boolean;
    email: boolean;
    affiliation: boolean;
  }) => void;
  group: (group: string) => void;
};

// Auth.js wraps a callback's original Error in CallbackRouteError. Remember its
// identity without mutating it so the framework logger doesn't count it twice.
const recordedErrors = new WeakSet<object>();
const noopDiagnostics: SignInDiagnostics = {
  stage: () => {},
  claims: () => {},
  group: () => {},
};

function emit(event: object) {
  try {
    // eslint-disable-next-line no-console -- This is the redacted server log sink.
    console.log(JSON.stringify(event));
  } catch {
    // Logging must never change authentication's result.
  }
}

function requestedCampus(profile: unknown) {
  try {
    const tenant = (profile as { requested?: { tenant?: unknown } } | undefined)
      ?.requested?.tenant;
    return (
      campuses.find((campus) => campus.ssoTenant === tenant)?.value ?? 'unknown'
    );
  } catch {
    return 'unknown';
  }
}

function failureReason(record: SignInRecord) {
  if (record.stage === 'user_upsert') {
    return record.has_eppn === false ? 'missing_eppn' : 'user_upsert_failed';
  }
  if (record.stage === 'claims') {
    return 'claims_processing_failed';
  }
  if (record.stage === 'group_assignment') {
    return 'group_assignment_failed';
  }
  return 'callback_failed';
}

export async function observeSamlSignIn<T>(
  profile: unknown,
  callback: (diagnostics: SignInDiagnostics) => Promise<T>
): Promise<T> {
  let record: SignInRecord;
  let start: number;
  try {
    start = Date.now();
    record = {
      event: 'policywonk_signin',
      schema_version: 1,
      correlation_id: randomUUID(),
      campus: requestedCampus(profile),
      stage: 'claims',
      has_eppn: null,
      has_email: null,
      has_affiliation: null,
      resolved_group: null,
    };
  } catch {
    return callback(noopDiagnostics);
  }

  const diagnostics: SignInDiagnostics = {
    stage: (stage) => {
      record.stage = stage;
    },
    claims: ({ eppn, email, affiliation }) => {
      record.has_eppn = eppn;
      record.has_email = email;
      record.has_affiliation = affiliation;
    },
    group: (group) => {
      record.resolved_group =
        campuses.find((campus) => campus.value === group)?.value ?? 'unknown';
    },
  };
  let outcome: 'completed' | 'failed' = 'completed';
  let reason: string | undefined;
  try {
    return await callback(diagnostics);
  } catch (error) {
    outcome = 'failed';
    reason = failureReason(record);
    if (
      error !== null &&
      (typeof error === 'object' || typeof error === 'function')
    ) {
      recordedErrors.add(error);
    }
    throw error;
  } finally {
    try {
      emit({
        ...record,
        outcome,
        ...(reason ? { reason } : {}),
        timestamp: new Date().toISOString(),
        duration_ms: Math.max(0, Date.now() - start),
      });
    } catch {
      // Even unavailable clocks or record serialization cannot change sign-in.
    }
  }
}

const authErrorReasons: Record<string, string> = {
  OAuthCallbackError: 'oauth_callback_failed',
  OAuthProfileParseError: 'oauth_profile_failed',
  OAuthSignInError: 'oauth_authorization_failed',
  InvalidCheck: 'oauth_check_failed',
  MissingCSRF: 'csrf_check_failed',
  CallbackRouteError: 'callback_failed',
  AccessDenied: 'access_denied',
  JWTSessionError: 'session_token_failed',
  SessionTokenError: 'session_token_failed',
  MissingSecret: 'configuration_error',
  UntrustedHost: 'configuration_error',
  InvalidProvider: 'configuration_error',
};

function wasRecorded(error: unknown): boolean {
  let current = error;
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== 'object') {
      return false;
    }
    if (recordedErrors.has(current)) {
      return true;
    }
    current = (current as { cause?: { err?: unknown } }).cause?.err;
  }
  return false;
}

// Never pass Auth.js errors, causes, stack traces, or debug metadata to the sink.
// Failures before the JWT callback lack a trusted campus and timing context.
export const authDiagnosticLogger = {
  error(error: Error) {
    try {
      if (wasRecorded(error)) {
        return;
      }
      const type = (error as { type?: unknown }).type;
      const reason =
        typeof type === 'string' && Object.hasOwn(authErrorReasons, type)
          ? authErrorReasons[type]
          : 'auth_error';
      emit({
        event: 'auth_error',
        schema_version: 1,
        correlation_id: randomUUID(),
        timestamp: new Date().toISOString(),
        stage: 'auth_framework',
        reason,
      });
    } catch {
      // Error logging cannot interfere with Auth.js's error response.
    }
  },
  warn(code: string) {
    try {
      emit({
        event: 'auth_warning',
        schema_version: 1,
        timestamp: new Date().toISOString(),
        reason:
          code === 'debug-enabled' ? 'debug_enabled' : 'configuration_warning',
      });
    } catch {
      // Warnings are diagnostic only.
    }
  },
  debug() {},
};
