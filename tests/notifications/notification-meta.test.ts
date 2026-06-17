import { describe, expect, it } from "vitest";
import { NotificationType } from "@/service/models";
import { notificationMeta } from "@/features/notifications/lib/notificationMeta";

describe("notificationMeta", () => {
  it("maps every NotificationType to a defined icon + tone", () => {
    for (const type of Object.values(NotificationType)) {
      const meta = notificationMeta(type);
      expect(meta.icon).toBeDefined();
      expect(meta.tone).toBeTruthy();
    }
  });

  it("colors failures red and completions green (meaning, not decoration)", () => {
    expect(notificationMeta(NotificationType.UploadFailed).tone).toBe("red");
    expect(notificationMeta(NotificationType.ArchiveCreateFailed).tone).toBe("red");
    expect(notificationMeta(NotificationType.QuotaExceeded).tone).toBe("red");
    expect(notificationMeta(NotificationType.ArchiveCreateComplete).tone).toBe("green");
    expect(notificationMeta(NotificationType.DuplicateScanComplete).tone).toBe("green");
    expect(notificationMeta(NotificationType.TeamInvitationAccepted).tone).toBe("green");
    expect(notificationMeta(NotificationType.QuotaWarning).tone).toBe("amber");
  });

  it("falls back to a neutral tone for an unknown / future type", () => {
    const meta = notificationMeta("SOME_FUTURE_TYPE");
    expect(meta.icon).toBeDefined();
    expect(meta.tone).toBe("slate");
  });
});
