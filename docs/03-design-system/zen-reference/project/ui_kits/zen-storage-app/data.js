// Fake folder tree for the Zen Storage UI kit demo.
// Media entries carry `thumb` (URL relative to index.html) + `ratio` (w/h)
// so the smart grid can lay them out at natural aspect ratio; videos also
// carry a formatted `duration`.
const ZS_T = "../../assets/thumbs/";
window.ZS_DATA = {
  "": [
    { name: "Documents", kind: "dir" },
    { name: "Photos", kind: "dir" },
    { name: "Projects", kind: "dir" },
    { name: "Vault", kind: "dir", encrypted: true, locked: true },
    { name: "Private", kind: "dir", hidden: true },
    { name: "quarterly-report.pdf", kind: "file", size: 4200000, modified: "2026-05-12" },
    { name: "backup-2026.zip", kind: "file", size: 734000000, modified: "2026-04-02" },
    { name: "notes.md", kind: "file", size: 2400, modified: "2026-06-01" },
  ],
  "Documents": [
    { name: "Contracts", kind: "dir" },
    { name: "invoice-0419.pdf", kind: "file", size: 182000, modified: "2026-04-19" },
    { name: "meeting-notes.docx", kind: "file", size: 48000, modified: "2026-05-30" },
  ],
  "Documents/Contracts": [
    { name: "msa-signed.pdf", kind: "file", size: 921000, modified: "2026-01-15" },
  ],
  "Photos": [
    { name: "Albums", kind: "dir" },
    { name: "kyoto-garden.jpg", kind: "file", size: 5400000, modified: "2026-03-22", thumb: ZS_T + "kyoto-garden.jpg", ratio: 3 / 2 },
    { name: "dunes.jpg", kind: "file", size: 4100000, modified: "2026-03-21", thumb: ZS_T + "dunes.jpg", ratio: 16 / 9 },
    { name: "pier-dusk.jpg", kind: "file", size: 3800000, modified: "2026-03-20", thumb: ZS_T + "pier-dusk.jpg", ratio: 3 / 2 },
    { name: "fern-portrait.jpg", kind: "file", size: 2900000, modified: "2026-03-18", thumb: ZS_T + "fern-portrait.jpg", ratio: 2 / 3 },
    { name: "city-fog.jpg", kind: "file", size: 4600000, modified: "2026-03-15", thumb: ZS_T + "city-fog.jpg", ratio: 3 / 2 },
    { name: "terracotta-wall.jpg", kind: "file", size: 3200000, modified: "2026-03-12", thumb: ZS_T + "terracotta-wall.jpg", ratio: 1 },
    { name: "coastline.jpg", kind: "file", size: 6800000, modified: "2026-03-10", thumb: ZS_T + "coastline.jpg", ratio: 21 / 9 },
    { name: "mountain-haze.jpg", kind: "file", size: 4400000, modified: "2026-03-08", thumb: ZS_T + "mountain-haze.jpg", ratio: 4 / 3 },
    { name: "clay-portrait.jpg", kind: "file", size: 3100000, modified: "2026-03-05", thumb: ZS_T + "clay-portrait.jpg", ratio: 3 / 4 },
    { name: "morning-field.jpg", kind: "file", size: 5000000, modified: "2026-02-28", thumb: ZS_T + "morning-field.jpg", ratio: 3 / 2 },
    { name: "night-lights.jpg", kind: "file", size: 2700000, modified: "2026-02-22", thumb: ZS_T + "night-lights.jpg", ratio: 16 / 9 },
    { name: "paper-still.jpg", kind: "file", size: 2200000, modified: "2026-02-18", thumb: ZS_T + "paper-still.jpg", ratio: 4 / 3 },
    { name: "lake-mirror.jpg", kind: "file", size: 5900000, modified: "2026-02-14", thumb: ZS_T + "lake-mirror.jpg", ratio: 3 / 2 },
    { name: "matsuri-clip.mp4", kind: "file", size: 184000000, modified: "2026-02-10", thumb: ZS_T + "video-demo.jpg", ratio: 16 / 9, duration: "0:42" },
  ],
  "Photos/Albums": [
    { name: "trip-kyoto.jpg", kind: "file", size: 5400000, modified: "2026-03-22", thumb: ZS_T + "kyoto-garden.jpg", ratio: 3 / 2 },
    { name: "team-offsite.png", kind: "file", size: 8100000, modified: "2026-02-10", thumb: ZS_T + "morning-field.jpg", ratio: 3 / 2 },
  ],
  "Projects": [
    { name: "Q2 launch", kind: "dir" },
    { name: "roadmap.xlsx", kind: "file", size: 96000, modified: "2026-05-05" },
  ],
  "Projects/Q2 launch": [
    { name: "demo-final.mp4", kind: "file", size: 734000000, modified: "2026-05-28", thumb: ZS_T + "video-demo.jpg", ratio: 16 / 9, duration: "2:08" },
    { name: "launch-checklist.md", kind: "file", size: 5200, modified: "2026-06-02" },
  ],
  "Vault": [
    { name: "recovery-codes.txt", kind: "file", size: 900, modified: "2025-11-20" },
    { name: "passport-scan.pdf", kind: "file", size: 2400000, modified: "2026-01-08" },
    { name: "tax-archive-2025.zip", kind: "file", size: 48000000, modified: "2026-02-01" },
  ],
  "Private": [
    { name: "journal.md", kind: "file", size: 12000, modified: "2026-05-20" },
  ],
};

// Demo contents of pre-seeded archives, keyed by the archive's full path.
// Extracting recreates `entries` inside a new folder; `tree` holds nested
// folder contents keyed by path RELATIVE to that folder. Archives created
// in-session snapshot their own contents instead (see StorageScreen).
window.ZS_ARCHIVE_CONTENTS = {
  "backup-2026.zip": {
    entries: [
      { name: "site", kind: "dir", modified: "2026-04-02" },
      { name: "database.sql", kind: "file", size: 412000000, modified: "2026-04-02" },
      { name: "manifest.json", kind: "file", size: 4600, modified: "2026-04-02" },
      { name: "env-backup.txt", kind: "file", size: 1800, modified: "2026-04-02" },
    ],
    tree: {
      "site": [
        { name: "index.html", kind: "file", size: 24000, modified: "2026-04-02" },
        { name: "styles.css", kind: "file", size: 61000, modified: "2026-04-02" },
        { name: "app.js", kind: "file", size: 384000, modified: "2026-04-02" },
      ],
    },
  },
  "Vault/tax-archive-2025.zip": {
    entries: [
      { name: "returns-2025.pdf", kind: "file", size: 3100000, modified: "2026-02-01" },
      { name: "receipts.csv", kind: "file", size: 88000, modified: "2026-02-01" },
      { name: "w2-scan.pdf", kind: "file", size: 1400000, modified: "2026-02-01" },
    ],
    tree: {},
  },
};
