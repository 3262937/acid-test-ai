// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const session = new (globalThis as any).Supabase.ai.Session("gte-small");

const DOCS: { source: string; content: string }[] = [
  {
    source: "login/user_login.txt",
    content: `# Scenario: User Login
## Acceptance Criteria
- User can log in with valid email and password
- User receives clear error message for invalid credentials
- Account is locked after 5 consecutive failed attempts
- Session expires after 30 minutes of inactivity
- User can log in via OAuth (Google, GitHub)
## Positive Cases
1. Valid email + valid password -> user redirected to dashboard
2. Valid email + valid password + "Remember me" checked -> session persists for 30 days
3. OAuth Google login -> user redirected to dashboard with Google profile
4. OAuth GitHub login -> user redirected to dashboard with GitHub profile
5. Login after password reset -> successful authentication
## Negative Cases
1. Valid email + invalid password -> error: "Invalid email or password"
2. Invalid email format + any password -> error: "Please enter a valid email"
3. Empty email field -> error: "Email is required"
4. Empty password field -> error: "Password is required"
5. SQL injection in email field -> input sanitized, no injection executed
6. Account locked after 5 failures -> error: "Account locked. Try again in 15 minutes"
## Edge Cases
1. Email with trailing spaces -> trimmed, login succeeds
2. Password with special characters (!@#$%^&*) -> login succeeds
3. Unicode characters in email (custom domain) -> login succeeds
4. Concurrent login from two devices -> both sessions valid
5. Login during password change in progress -> uses current password at time of attempt
6. Session expiry during active use -> redirect to login with return URL
## Security Considerations
- Password must never appear in logs or API responses
- JWT token must have short TTL (15 min access, 7 day refresh)
- Rate limit: max 10 login attempts per minute per IP
- OAuth state parameter must be cryptographically random (32 bytes hex)
- CSRF protection on all login forms`,
  },
  {
    source: "authentication/password_reset.txt",
    content: `# Scenario: Password Reset
## Acceptance Criteria
- User can request password reset via registered email
- Reset link is sent to email within 60 seconds
- Reset link expires after 1 hour
- User can set new password meeting complexity requirements
- Old password invalidated after successful reset
## Positive Cases
1. Valid email receives reset link -> email sent, link contains token
2. Click valid reset link within 1 hour -> password reset form displayed
3. Submit new password meeting requirements -> password updated, old password fails
4. Multiple reset requests -> latest link valid, previous links invalidated
## Negative Cases
1. Unregistered email -> generic message "If account exists, email sent" (no user enumeration)
2. Expired reset link (>1 hour) -> error: "Reset link expired, request a new one"
3. Already-used reset link -> error: "Link already used, request a new one"
4. New password too weak (<8 chars, no special) -> validation error with requirements
5. New password same as old -> error: "Must be different from current password"
## Edge Cases
1. Request reset, then remember password and login -> login works, reset link still valid until used or expired
2. Reset link clicked from different device/browser -> works (token-based, not session-based)
3. Concurrent reset from two sessions -> first use wins, second gets "already used"
4. Email with + alias (user+tag@gmail.com) -> handled according to email provider rules
5. Unicode in new password -> accepted if meets length/complexity requirements
## Security Notes
- Reset token: 32+ bytes cryptographic random, single-use
- Token stored hashed (bcrypt) in database, never plaintext
- Rate limit: max 5 reset requests per hour per email
- No information leakage: same message for registered and unregistered emails`,
  },
  {
    source: "crud/crud_operations.txt",
    content: `# Scenario: CRUD Operations on Resources
## Acceptance Criteria
- User can create a new resource with all required fields
- User can read/view existing resources with pagination
- User can update own resources (not others')
- User can delete own resources (soft delete)
- All operations return appropriate status codes
## Positive Cases
1. Create resource with valid fields -> 201 Created, resource appears in list
2. Read resource by ID -> 200 OK with full resource data
3. List resources with default pagination -> 200 OK with page 1 (20 items)
4. Update resource with valid changes -> 200 OK, changes persisted
5. Delete resource -> 200 OK, resource marked as deleted, not in list
6. List resources with filters -> 200 OK, only matching resources returned
## Negative Cases
1. Create resource missing required field -> 422, error lists missing field
2. Create resource with duplicate unique field -> 409 Conflict
3. Read nonexistent resource ID -> 404 Not Found
4. Update another user's resource -> 403 Forbidden
5. Delete another user's resource -> 403 Forbidden
6. Create resource with field exceeding max length -> 422, validation error
7. Update with invalid data type (string where int expected) -> 422
8. List with invalid page number (0, -1) -> 422
## Edge Cases
1. Create resource with all optional fields omitted -> defaults applied
2. Create resource with all fields at max length -> 201 Created
3. List with page beyond last page -> 200 OK, empty data array
4. List with limit=1 -> 200 OK, exactly 1 item returned
5. Update only one field out of ten -> other fields unchanged
6. Delete already-deleted resource -> 404 Not Found (idempotent)
7. Create resource with Unicode characters in text fields -> stored correctly
8. Concurrent updates to same resource -> last write wins or optimistic lock error
## API Contract
- Create: POST /api/v1/resources, body: {name, description?, tags?}
- Read: GET /api/v1/resources/{id}
- List: GET /api/v1/resources?page=1&limit=20&sort=created_at&order=desc
- Update: PUT /api/v1/resources/{id}
- Delete: DELETE /api/v1/resources/{id}`,
  },
  {
    source: "api_testing/rest_api_patterns.txt",
    content: `# Scenario: REST API Testing
## Acceptance Criteria
- API returns correct status codes for all operations
- API validates request bodies against schema
- API enforces authentication on protected endpoints
- API returns consistent error response format
- API respects rate limits
## Positive Cases
1. GET endpoint returns 200 with expected data structure
2. POST endpoint returns 201 with created resource including generated ID
3. PUT endpoint returns 200 with updated resource
4. DELETE endpoint returns 204 No Content
5. Options/preflight request returns CORS headers
6. API returns correct Content-Type header (application/json)
## Negative Cases
1. POST with missing required fields -> 422 with validation error details
2. GET without auth token -> 401 Unauthorized
3. GET with expired token -> 401 Unauthorized with "Token expired" message
4. POST with invalid JSON body -> 422 with parse error
5. Request exceeds rate limit -> 429 with Retry-After header
6. Request with invalid route -> 404 Not Found
7. PUT with conflicting data -> 409 Conflict
8. POST with content-type other than application/json -> 415 Unsupported Media Type
## Edge Cases
1. Request body exactly at max size limit -> accepted
2. Request body 1 byte over max size limit -> 413 Payload Too Large
3. Deeply nested JSON (10+ levels) -> parse succeeds or depth limit error
4. Request with extra unknown fields -> ignored or accepted based on schema
5. Pagination with limit=0 -> 422 or return empty
6. Unicode in URL path parameters -> decoded correctly
7. Concurrent identical POST requests -> both process or one returns 409
## Error Response Format
All errors must follow: {"detail": "Human-readable message", "code": "MACHINE_READABLE_CODE"}`,
  },
  {
    source: "file_upload/file_upload.txt",
    content: `# Scenario: File Upload
## Acceptance Criteria
- User can upload files up to 10MB
- Supported formats: PNG, JPG, PDF, DOCX, XLSX
- Upload shows progress indicator
- Invalid files are rejected with clear error message
- Uploaded files are virus-scanned before storage
## Positive Cases
1. Upload valid PNG image (2MB) -> 200 OK, file URL returned
2. Upload valid PDF document (5MB) -> 200 OK, file URL returned
3. Upload valid DOCX file (1MB) -> 200 OK, file URL returned
4. Upload multiple files (3 files, each 2MB) -> 200 OK, all URLs returned
5. Upload file with Unicode filename -> 200 OK, filename preserved
## Negative Cases
1. Upload file exceeding 10MB -> 413, "File size exceeds 10MB limit"
2. Upload .exe file -> 422, "File type not supported"
3. Upload empty file (0 bytes) -> 422, "File is empty"
4. Upload file with no Content-Type header -> 422, "Content-Type required"
5. Upload malicious filename (../../../etc/passwd) -> filename sanitized, stored safely
6. Upload corrupted PDF -> 422, "File appears to be corrupted"
## Edge Cases
1. Upload file exactly at 10MB limit -> accepted
2. Upload file 1 byte over 10MB -> rejected with 413
3. Upload file with duplicate name -> server generates unique name, no overwrite
4. Upload during network interruption -> partial file cleaned up, no orphan stored
5. Concurrent uploads (10 simultaneous) -> all succeed or queue without data loss
6. Upload file with special characters in name -> name sanitized, content intact
7. Resume interrupted upload -> partial file replaced with complete file`,
  },
  {
    source: "form_validation/form_validation.txt",
    content: `# Scenario: Form Validation
## Acceptance Criteria
- All required fields are validated before submission
- Validation errors appear immediately on blur (client-side) and on submit (server-side)
- Error messages are specific and actionable
- Valid input is preserved when validation errors occur
- Client and server validation rules are identical
## Positive Cases
1. Submit form with all valid fields -> form processes successfully
2. Leave optional field empty -> form submits, optional field uses default
3. Enter field value at minimum allowed length -> accepted
4. Enter field value at maximum allowed length -> accepted
5. Correct validation error, resubmit -> form processes successfully
## Negative Cases
1. Submit with required field empty -> error: "[Field] is required"
2. Enter email without @ -> error: "Please enter a valid email address"
3. Enter phone number with letters -> error: "Phone number must contain only digits"
4. Enter date in future when past date required -> error: "Date must be in the past"
5. Enter number below minimum -> error: "Value must be at least [min]"
6. Enter number above maximum -> error: "Value must be at most [max]"
7. Enter URL without protocol -> error: "URL must start with http:// or https://"
8. Enter password without required complexity -> error showing all unmet requirements
## Edge Cases
1. Field exactly at min length -> accepted
2. Field exactly at max length -> accepted
3. Field 1 char over max length -> rejected on client or server
4. Paste text with leading/trailing whitespace -> trimmed before validation
5. Enter only spaces in required field -> treated as empty after trim
6. Copy-paste from Word with smart quotes -> converted to standard quotes
7. Auto-complete fills field -> validation triggers and accepts valid auto-fill
8. Tab through all fields without entering data -> errors shown inline on blur`,
  },
];

function chunkText(text: string, size = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  if (text.length <= size) return [text];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const reset = body?.reset === true;
    const start = typeof body?.start === "number" ? body.start : 0;
    const end = typeof body?.end === "number" ? body.end : DOCS.length;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (reset) {
      const { error: delErr } = await supabase
        .from("kb_documents")
        .delete()
        .not("id", "is", null);
      if (delErr) throw delErr;
      return new Response(JSON.stringify({ reset: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let inserted = 0;
    for (let d = start; d < Math.min(end, DOCS.length); d++) {
      const doc = DOCS[d];
      const chunks = chunkText(doc.content, 500, 50);
      const rows: {
        content: string;
        source: string;
        metadata: Record<string, unknown>;
        embedding: number[];
      }[] = [];
      for (const chunk of chunks) {
        const embedding = await session.run(chunk, { mean_pool: true, normalize: true });
        rows.push({
          content: chunk,
          source: doc.source,
          metadata: { source: doc.source },
          embedding,
        });
      }
      const { error } = await supabase.from("kb_documents").insert(rows);
      if (error) throw error;
      inserted += rows.length;
    }

    return new Response(JSON.stringify({ inserted, processed: [start, Math.min(end, DOCS.length)] }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("ingest-kb error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
