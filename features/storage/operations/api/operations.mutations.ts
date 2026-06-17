import { newIdempotencyKey } from "@/lib/api";
import {
  cloudApiFactory,
  cloudDirectoryApiFactory,
  cloudDocumentsApiFactory,
} from "@/service/factories";
import type { CloudDeleteModel, CloudMoveItemModel } from "@/service/models";
import type { ConflictStrategy } from "../lib/conflict";

/* ── Create ───────────────────────────────────────────────────────────── */

export async function createFolder(input: {
  Path: string;
  ConflictStrategy?: ConflictStrategy;
  IsEncrypted?: boolean;
  /** Set only when creating an encrypted folder — rides `X-Folder-Passphrase`, never stored. */
  Passphrase?: string;
}): Promise<void> {
  await cloudDirectoryApiFactory.directoryCreate({
    directoryCreateRequestModel: {
      Path: input.Path,
      IsEncrypted: input.IsEncrypted ?? false,
      ConflictStrategy: input.ConflictStrategy,
    },
    ...(input.Passphrase ? { xFolderPassphrase: input.Passphrase } : {}),
  });
}

/** Result of starting an async (durable) plain folder create. */
export interface DirectoryCreateStartResult {
  /** BullMQ job id, or `""` for a SKIP no-op (nothing enqueued). */
  JobId: string;
  Path: string;
}

/**
 * Start an async PLAIN folder create (`Cloud/Directory/Create/Start`) — returns a
 * JobId immediately; the worker does the S3 write and emits `FOLDER_CREATE_*`.
 * Conflict detection still runs synchronously server-side (409 propagates here to
 * drive the prompt). The generated client doesn't yet expose `directoryCreateStart`
 * (regen pending — `bun run generate:service:test` against the rebuilt backend);
 * call it via a typed shim that throws `TypeError` when absent so the caller can
 * fall back to the synchronous {@link createFolder}.
 */
export async function startDirectoryCreate(input: {
  Path: string;
  ConflictStrategy?: ConflictStrategy;
}): Promise<DirectoryCreateStartResult> {
  const factory = cloudDirectoryApiFactory as unknown as {
    directoryCreateStart?: (args: {
      directoryCreateStartRequestModel: {
        Path: string;
        ConflictStrategy?: ConflictStrategy;
      };
    }) => Promise<{ data: unknown }>;
  };
  if (typeof factory.directoryCreateStart !== "function") {
    throw new TypeError("directoryCreateStart unavailable (client regen pending)");
  }
  const res = await factory.directoryCreateStart({
    directoryCreateStartRequestModel: {
      Path: input.Path,
      ConflictStrategy: input.ConflictStrategy,
    },
  });
  return res.data as DirectoryCreateStartResult;
}

export async function createFile(input: {
  Path: string;
  Name: string;
  ConflictStrategy?: ConflictStrategy;
}): Promise<void> {
  await cloudDocumentsApiFactory.create({
    documentCreateRequestModel: {
      Path: input.Path,
      Name: input.Name,
      Content: "",
      ConflictStrategy: input.ConflictStrategy,
    },
  });
}

/* ── Rename ───────────────────────────────────────────────────────────── */

export async function renameFile(input: {
  Key: string;
  Name: string;
  ConflictStrategy?: ConflictStrategy;
}): Promise<void> {
  await cloudApiFactory.update({
    cloudUpdateRequestModel: {
      Key: input.Key,
      Name: input.Name,
      ConflictStrategy: input.ConflictStrategy,
    },
  });
}

export async function renameDirectory(input: {
  Path: string;
  Name: string;
  ConflictStrategy?: ConflictStrategy;
}): Promise<void> {
  await cloudDirectoryApiFactory.directoryRename({
    directoryRenameRequestModel: {
      Path: input.Path,
      Name: input.Name,
      ConflictStrategy: input.ConflictStrategy,
    },
  });
}

/* ── Delete (files + unencrypted dirs, one call; idempotent) ──────────── */

export async function deleteEntries(items: CloudDeleteModel[]): Promise<void> {
  await cloudApiFactory._delete({
    idempotencyKey: newIdempotencyKey(),
    cloudDeleteRequestModel: { Items: items },
  });
}

/* ── Move (idempotent) ────────────────────────────────────────────────── */

export async function moveEntries(input: {
  items: CloudMoveItemModel[];
  destinationKey: string;
  strategy?: ConflictStrategy;
}): Promise<void> {
  await cloudApiFactory.move({
    idempotencyKey: newIdempotencyKey(),
    cloudMoveRequestModel: {
      Items: input.items,
      DestinationKey: input.destinationKey,
      ConflictResolution: input.strategy ? { Strategy: input.strategy } : undefined,
    },
  });
}

/* ── Download (presigned URL) ─────────────────────────────────────────── */

export async function getDownloadUrl(key: string): Promise<string> {
  const res = await cloudApiFactory.getPresignedUrl({ key });
  return res.data as unknown as string;
}
