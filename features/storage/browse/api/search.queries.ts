import { cloudApiFactory } from "@/service/factories";
import type { CloudSearchResponseModel } from "@/service/models";

/**
 * Filename search via `Cloud/Search`. Pass `path` to scope to a folder (current
 * scope); omit it for a global search. `extension` (no leading dot) narrows by
 * type server-side. `xTeamId`/folder-session headers are injected by the
 * interceptors — never pass them here.
 *
 * The envelope interceptor already unwrapped `{ Result, Status }` → the bare
 * `Result`, so `res.data` IS the `CloudSearchResponseModel` (don't read `.Result`).
 */
export async function getSearch(
  args: {
    query: string;
    path?: string;
    extension?: string;
    skip?: number;
    take?: number;
  },
  signal?: AbortSignal,
): Promise<CloudSearchResponseModel> {
  const res = await cloudApiFactory.search(
    {
      query: args.query,
      path: args.path,
      extension: args.extension,
      skip: args.skip,
      take: args.take,
    },
    { signal },
  );
  return res.data as unknown as CloudSearchResponseModel;
}
