/** Known developers with public provenance — no invented corporate facts. */

export const DEVELOPERS = {
  gamuda: {
    id: "dev_gamuda_land",
    slug: "gamuda-land",
    name: "Gamuda Land",
    website: "https://www.gamudaland.com.vn",
    sourceClass: "verified_public" as const,
    provenance: "Public developer website and press releases",
  },
  vinhomes: {
    id: "dev_vinhomes",
    slug: "vinhomes",
    name: "Vinhomes",
    website: "https://vinhomes.vn",
    sourceClass: "verified_public" as const,
    provenance: "Vinhomes / Vingroup public corporate and project pages",
  },
  ecopark: {
    id: "dev_ecopark",
    slug: "ecopark",
    name: "Ecopark",
    website: "https://ecopark.com.vn",
    sourceClass: "verified_public" as const,
    provenance: "Ecopark public website and published urban masterplan communications",
  },
  datXanhBluemarq: {
    id: "dev_dat_xanh_bluemarq",
    slug: "dat-xanh-bluemarq",
    name: "Đất Xanh / Bluemarq Group",
    website: "https://www.datxanh.com.vn",
    sourceClass: "verified_public" as const,
    provenance:
      "Đất Xanh Group public disclosures; brand transition to Bluemarq Group reported 2026 (ticker DXG retained)",
  },
} as const;
