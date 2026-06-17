import type { BaseStatusModel } from "@/service/models";

/** Typed off the generated models — never hand-roll DTO shapes in fixtures. */
export const okStatusFixture: BaseStatusModel = {
  Messages: ["OK"],
  Code: 200,
  Timestamp: new Date(0).toISOString(),
  Path: "/Api/Account/Profile",
};
