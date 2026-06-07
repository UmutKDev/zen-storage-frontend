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
}): Promise<void> {
  await cloudDirectoryApiFactory.directoryCreate({
    directoryCreateRequestModel: {
      Path: input.Path,
      IsEncrypted: false,
      ConflictStrategy: input.ConflictStrategy,
    },
  });
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
