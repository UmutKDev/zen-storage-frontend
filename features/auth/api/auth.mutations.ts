import { authenticationApiFactory } from "@/service/factories";
import type {
  AuthenticationResponseModel,
  LoginCheckResponseModel,
} from "@/service/models";

/**
 * Typed thin wrappers over the generated Authentication factory. The envelope
 * interceptor already unwraps `{ Result, Status }`, so `res.data` is the bare
 * model (the generated static type still says the wrapper — hence the cast).
 */
export async function loginCheck(
  email: string,
): Promise<LoginCheckResponseModel> {
  const res = await authenticationApiFactory.loginCheck({
    loginCheckRequestModel: { Email: email },
  });
  return res.data as unknown as LoginCheckResponseModel;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.login({
    loginRequestModel: { Email: email, Password: password },
  });
  return res.data as unknown as AuthenticationResponseModel;
}

/** Step-3 2FA — carries the session id from the `login` step (the §6 handoff). */
export async function verify2FA(
  code: string,
  sessionId: string,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.verify2FA(
    { twoFactorVerifyRequestModel: { Code: code } },
    { headers: { "X-Session-Id": sessionId } },
  );
  return res.data as unknown as AuthenticationResponseModel;
}

export async function register(
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthenticationResponseModel> {
  const res = await authenticationApiFactory.register({
    registerRequestModel: {
      Email: email,
      Password: password,
      PasswordConfirmation: passwordConfirmation,
    },
  });
  return res.data as unknown as AuthenticationResponseModel;
}

export async function resetPassword(email: string): Promise<boolean> {
  const res = await authenticationApiFactory.resetPassword({
    resetPasswordRequestModel: { Email: email },
  });
  return res.data as unknown as boolean;
}
