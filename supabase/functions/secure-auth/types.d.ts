// Type declarations for Deno runtime (for IDE support only)
declare global {
  namespace Deno {
    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

// Request interface for Edge Functions
interface EdgeRequest {
  method: string;
  headers: {
    get: (name: string) => string | null;
  };
}

// Response interface
interface EdgeResponseInit {
  headers?: Record<string, string>;
  status?: number;
}

// Edge Function serve function
declare function serve(handler: (req: EdgeRequest) => Promise<Response>): void;

export {};
