import axios from "axios";
import { env } from "@/config/env";
import { REQUEST_TIMEOUT_MS } from "@/config/constants";
import { sessionRequestInterceptor } from "./interceptors/session";
import { teamRequestInterceptor } from "./interceptors/team";
import { secureFolderRequestInterceptor } from "./interceptors/secure-folder";
import { idempotencyRequestInterceptor } from "./interceptors/idempotency";
import {
  envelopeResponseFulfilled,
  envelopeResponseRejected,
} from "./interceptors/envelope";

/**
 * The single shared axios client. Pure composer — no business logic. Each
 * concern is an independently testable interceptor file.
 */
// The generated client paths already include the `/Api` prefix
// (e.g. "/Api/Account/Profile"), so the baseURL is just the origin. A trailing
// `/Api` is stripped defensively in case the env var includes it.
const baseURL = env.NEXT_PUBLIC_API_URL.replace(/\/Api\/?$/, "");

const Instance = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
});

// Response side: the envelope / error boundary.
Instance.interceptors.response.use(
  envelopeResponseFulfilled,
  envelopeResponseRejected,
);

// Request side: axios runs request interceptors in REVERSE registration order,
// so registering idempotency → secure-folder → team → session yields the
// on-wire order session → team → secure-folder → idempotency.
Instance.interceptors.request.use(idempotencyRequestInterceptor);
Instance.interceptors.request.use(secureFolderRequestInterceptor);
Instance.interceptors.request.use(teamRequestInterceptor);
Instance.interceptors.request.use(sessionRequestInterceptor);

export default Instance;
