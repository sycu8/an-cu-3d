/**
 * Curated project cover + gallery media seeds.
 * Chỉ dùng hình thật hoặc hình từ CĐT / nền tảng chính thức.
 * Không Unsplash minh họa, không AI generation.
 *
 * - Celadon City: https://celadoncityhcm.com/
 * - Eaton Park / Elysian: Gamuda Land (gamudaland.com.vn + GCS CĐT)
 * - Vinhomes: Wikimedia Commons + CDN OneHousing (media CĐT)
 * - Ecopark / Aqua Bay: https://ecopark.com.vn/
 * - Opal Boulevard: archive trang CĐT opalboulevard.vn (Wayback)
 * - The Privé: https://theprive.vn/
 */


import type { ProjectMediaItem } from "../types";

export type ProjectMediaSeed = {
  coverUrl: string;
  items: ProjectMediaItem[];
};

/** Hosts allowed for seeded project imagery (tests + CSP). */
export const OFFICIAL_MEDIA_HOST_SUFFIXES = [
  "celadoncityhcm.com",
  "ecopark.com.vn",
  "gamudaland.com.vn",
  "storage.googleapis.com",
  "cdn.onehousing.vn",
  "upload.wikimedia.org",
  "web.archive.org",
  "theprive.vn",
] as const;

export function isOfficialMediaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OFFICIAL_MEDIA_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}


function media(
  id: string,
  kind: ProjectMediaItem["kind"],
  url: string,
  altText: string,
  caption: string,
  provenance: string,
  sortOrder: number,
  sourceClass = "verified_public",
): ProjectMediaItem {
  return { id, kind, url, altText, caption, provenance, sortOrder, sourceClass };
}


const CELADON = "https://celadoncityhcm.com/wp-content/uploads";
const CELADON_SRC = "https://celadoncityhcm.com/";
const GAMUDA_GCS = "https://storage.googleapis.com/glvncorpweb01p-bucket";
const GAMUDA_SRC = "https://gamudaland.com.vn/";
const ECOPARK = "https://ecopark.com.vn";
const ECOPARK_SRC = "https://ecopark.com.vn/";
const OH = "https://cdn.onehousing.vn";
const OH_SRC = "https://onehousing.vn/ (media CĐT Vinhomes)";
const WM = "https://upload.wikimedia.org/wikipedia/commons";
const WM_SRC = "Wikimedia Commons — ảnh thực địa";
const OPAL_WA =
  "https://web.archive.org/web/20231210200920im_/https://www.opalboulevard.vn";
const OPAL_SRC = "https://opalboulevard.vn/ (archive CĐT Đất Xanh)";
const PRIVE = "https://theprive.vn/wp-content/uploads";
const PRIVE_SRC = "https://theprive.vn/";

export const PROJECT_MEDIA_SEEDS: Record<string, ProjectMediaSeed> = {
  "celadon-city": {
    coverUrl: `${CELADON}/2020/12/98000254_101754371555953_4289346695638024192_o.jpg`,
    items: [
      // —— Atlas / mặt bằng 2D ——
      media("media_celadon_atlas", "atlas", `${CELADON}/2020/05/Overview.jpg`, "Tổng quan Celadon City", "Atlas / tổng quan quy hoạch", CELADON_SRC, 0),
      media("media_celadon_masterplan", "atlas", `${CELADON}/2022/12/Mat-bang-tong-the-celadon.jpg`, "Mặt bằng tổng thể Celadon City", "Hình 2D — mặt bằng tổng thể", CELADON_SRC, 1),
      media("media_celadon_sitemap", "atlas", `${CELADON}/2018/10/map-update.jpg`, "Sơ đồ cập nhật Celadon City", "Hình 2D — sơ đồ quy hoạch", CELADON_SRC, 2),
      media("media_celadon_sodo", "floorplan_2d", `${CELADON}/2024/07/so-do-tong-the.jpg`, "Sơ đồ tổng thể Celadon City", "Hình 2D — sơ đồ tổng thể", CELADON_SRC, 3),
      media("media_celadon_standee", "floorplan_2d", `${CELADON}/2018/10/standee2.png`, "Standee mặt bằng Celadon City", "Hình 2D — standee / mặt bằng", CELADON_SRC, 4),
      media("media_celadon_stand1", "floorplan_2d", `${CELADON}/2018/10/stand1.png`, "Bảng mặt bằng Celadon City", "Hình 2D — bảng mặt bằng", CELADON_SRC, 5),
      media("media_celadon_type_b2", "floorplan_2d", `${CELADON}/2020/05/TypeB2.jpg`, "Mặt bằng căn hộ Type B2", "Hình 2D — mặt bằng căn hộ", CELADON_SRC, 6),
      media("media_celadon_type_c", "floorplan_2d", `${CELADON}/2020/05/TypeC.jpg`, "Mặt bằng căn hộ Type C", "Hình 2D — mặt bằng căn hộ", CELADON_SRC, 7),
      media("media_celadon_type_c1", "floorplan_2d", `${CELADON}/2020/05/TypeC1.jpg`, "Mặt bằng căn hộ Type C1", "Hình 2D — mặt bằng căn hộ", CELADON_SRC, 8),
      media("media_celadon_type_b1", "floorplan_2d", `${CELADON}/2024/10/C2_TypeB1.jpg`, "Mặt bằng căn hộ Type B1", "Hình 2D — mặt bằng căn hộ", CELADON_SRC, 9),
      media("media_celadon_dmbr", "floorplan_2d", `${CELADON}/2018/11/dmbr.png`, "Sơ đồ phân khu Celadon City", "Hình 2D — sơ đồ phân khu", CELADON_SRC, 10),
      media("media_celadon_elevation", "elevation", `${CELADON}/2018/12/181129_GAMUDA_DIAMONCITY_FACADE-VIEW-2_Final_LOGO.jpg`, "Mặt đứng Diamond City", "Hình 2D — mặt đứng", CELADON_SRC, 11),

      // —— Phối cảnh ——
      media("media_celadon_hero", "perspective", `${CELADON}/2020/12/98000254_101754371555953_4289346695638024192_o.jpg`, "Phối cảnh tổng thể Celadon City", "Phối cảnh dự án", CELADON_SRC, 20),
      media("media_celadon_bird", "perspective", `${CELADON}/2018/08/Bird-eye-view-1920.jpg`, "Góc nhìn toàn cảnh Celadon City", "Phối cảnh — bird eye", CELADON_SRC, 21),
      media("media_celadon_overall", "perspective", `${CELADON}/2018/10/Overall-view-1920.jpg`, "Phối cảnh tổng thể khu đô thị", "Phối cảnh tổng thể", CELADON_SRC, 22),
      media("media_celadon_2024", "perspective", `${CELADON}/2022/12/Celadon-2024.jpg`, "Celadon City cập nhật", "Phối cảnh hiện trạng", CELADON_SRC, 23),
      media("media_celadon_diamond", "perspective", `${CELADON}/2021/12/diamond1.jpg`, "Phân khu Diamond", "Phối cảnh phân khu Diamond", CELADON_SRC, 24),
      media("media_celadon_ruby", "perspective", `${CELADON}/2017/11/ruby-1920x1216-1.jpg`, "Phân khu Ruby", "Phối cảnh phân khu Ruby", CELADON_SRC, 25),
      media("media_celadon_emerald", "perspective", `${CELADON}/2017/11/Emerald-10.jpg`, "Phân khu Emerald", "Phối cảnh phân khu Emerald", CELADON_SRC, 26),
      media("media_celadon_brilliant", "perspective", `${CELADON}/2018/11/Brilliant-11.jpg`, "Diamond Brilliant", "Phối cảnh Diamond Brilliant", CELADON_SRC, 27),
      media("media_celadon_alnata", "perspective", `${CELADON}/2018/10/Alnata-1.jpg`, "Diamond Alnata", "Phối cảnh Diamond Alnata", CELADON_SRC, 28),
      media("media_celadon_glen", "perspective", `${CELADON}/2021/12/The-Glen.jpg`, "The Glen — Celadon City", "Phối cảnh The Glen", CELADON_SRC, 29),

      // —— Tiện ích đầy đủ ——
      media("media_celadon_aeon", "site", `${CELADON}/2020/05/AM-Tan-Phu-Celadon-1-scaled.jpg`, "AEON Mall Tân Phú Celadon", "Tiện ích — trung tâm thương mại AEON", CELADON_SRC, 40),
      media("media_celadon_park", "site", `${CELADON}/2018/10/3904-1920.jpg`, "Công viên sinh thái Celadon City", "Tiện ích — công viên / quang cảnh", CELADON_SRC, 41),
      media("media_celadon_school", "site", `${CELADON}/2018/10/57.jpg`, "Hệ thống giáo dục quốc tế", "Tiện ích — trường học", CELADON_SRC, 42),
      media("media_celadon_edu", "site", `${CELADON}/2018/10/edu-455x600-1.jpg`, "Giáo dục nội khu Celadon", "Tiện ích — giáo dục", CELADON_SRC, 43),
      media("media_celadon_sports", "site", `${CELADON}/2018/10/40595135_2203235536588207_979723563961417728_n.jpg`, "Celadon Sports & Resort Club", "Tiện ích — thể thao / resort club", CELADON_SRC, 44),
      media("media_celadon_club", "site", `${CELADON}/2018/10/club-455x600-1.jpg`, "Clubhouse Celadon", "Tiện ích — clubhouse", CELADON_SRC, 45),
      media("media_celadon_clubhouse", "site", `${CELADON}/2021/12/180701_GAMUDA-LAND_CLUBHOUSE_FINAL1-scaled.jpg`, "Gamuda Land Clubhouse", "Tiện ích — clubhouse Gamuda", CELADON_SRC, 46),
      media("media_celadon_pool", "site", `${CELADON}/2020/04/Pool-1.png`, "Hồ bơi Celadon City", "Tiện ích — hồ bơi", CELADON_SRC, 47),
      media("media_celadon_gym", "site", `${CELADON}/2020/04/gym.png`, "Phòng gym Celadon City", "Tiện ích — gym", CELADON_SRC, 48),
      media("media_celadon_playground", "site", `${CELADON}/2020/04/C11_KID-PLAYGROUND-scaled.jpg`, "Sân chơi trẻ em", "Tiện ích — sân chơi", CELADON_SRC, 49),
      media("media_celadon_coffee", "site", `${CELADON}/2020/04/Coffee-Hall.png`, "Coffee Hall", "Tiện ích — coffee hall", CELADON_SRC, 50),
      media("media_celadon_cinema", "site", `${CELADON}/2020/04/Sky-Movie.png`, "Sky Movie", "Tiện ích — rạp / giải trí", CELADON_SRC, 51),
      media("media_celadon_clinic", "site", "https://celadoncityhcm.com/wp-content/uploads/2018/10/Ph%C3%B2ng-kh%C3%A1m-Ho%C3%A0n-M%E1%BB%B9.jpg", "Phòng khám Hoàn Mỹ", "Tiện ích — y tế", CELADON_SRC, 52),
      media("media_celadon_security", "site", `${CELADON}/2018/10/an-ninh-celadon-city.jpg`, "An ninh Celadon City", "Tiện ích — an ninh", CELADON_SRC, 53),
      media("media_celadon_boulevard", "site", `${CELADON}/2018/10/z1043993066070_858dba5292ba5b5f70c4c43046ff8919.jpg`, "Đại lộ Gamuda", "Tiện ích — cảnh quan nội khu", CELADON_SRC, 54),
      media("media_celadon_alnata_blvd", "site", `${CELADON}/2018/10/Dai-lo-Diamond-Alnata.jpg`, "Đại lộ Diamond Alnata", "Tiện ích — đại lộ nội khu", CELADON_SRC, 55),
    ],
  },

  "eaton-park": {
    coverUrl: `${GAMUDA_GCS}/Eaton_Park_Hero_GLVN_19831eddd7.jpg`,
    items: [
      media("media_eaton_hero", "perspective", `${GAMUDA_GCS}/Eaton_Park_Hero_GLVN_19831eddd7.jpg`, "Phối cảnh Eaton Park", "Phối cảnh tổng thể", GAMUDA_SRC, 1),
      media("media_eaton_main", "perspective", `${GAMUDA_GCS}/Eaton_Park_Main_Image_8c187fb8b7_bceef832c5.webp`, "Eaton Park — hình chính CĐT", "Phối cảnh dự án", GAMUDA_SRC, 2),
      media("media_eaton_banner", "perspective", "https://gamudaland.com.vn/images/vn/landing/Hero-Banner_Eaton-Park3.jpg", "Banner Eaton Park trên gamudaland.com.vn", "Phối cảnh / banner CĐT", GAMUDA_SRC, 3),
      media("media_eaton_site_hero", "site", `${GAMUDA_GCS}/Eaton_Park_Hero_GLVN_19831eddd7.jpg`, "Không gian đô thị Eaton Park", "Tiện ích — quang cảnh dự án", GAMUDA_SRC, 10),
      media("media_eaton_site_main", "site", `${GAMUDA_GCS}/Eaton_Park_Main_Image_8c187fb8b7_bceef832c5.webp`, "Mặt đứng / cảnh quan Eaton Park", "Tiện ích — mặt ngoài", GAMUDA_SRC, 11),
      media("media_eaton_site_banner", "site", "https://gamudaland.com.vn/images/vn/landing/Hero-Banner_Eaton-Park3.jpg", "Cảnh quan tổng thể Eaton Park", "Tiện ích — tổng thể", GAMUDA_SRC, 12),
      media("media_eaton_site_gcs", "site", `${GAMUDA_GCS}/Eaton_Park_Hero_GLVN_19831eddd7.jpg`, "Eaton Park — media kho CĐT Gamuda", "Tiện ích — kho media CĐT", GAMUDA_SRC, 13),
    ],
  },

  elysian: {
    coverUrl: `${GAMUDA_GCS}/Elysian_Hero_GLVN_604d0f1d65.jpg`,
    items: [
      media("media_elysian_hero", "perspective", `${GAMUDA_GCS}/Elysian_Hero_GLVN_604d0f1d65.jpg`, "Phối cảnh Elysian", "Phối cảnh tổng thể", GAMUDA_SRC, 1),
      media("media_elysian_thumb", "perspective", `${GAMUDA_GCS}/Elysian_Thumbnail_3f3a46095c_79e8f99503.webp`, "Elysian — thumbnail CĐT", "Phối cảnh dự án", GAMUDA_SRC, 2),
      media("media_elysian_site_hero", "site", `${GAMUDA_GCS}/Elysian_Hero_GLVN_604d0f1d65.jpg`, "Quang cảnh Elysian", "Tiện ích — quang cảnh", GAMUDA_SRC, 10),
      media("media_elysian_site_thumb", "site", `${GAMUDA_GCS}/Elysian_Thumbnail_3f3a46095c_79e8f99503.webp`, "Không gian Elysian", "Tiện ích — tổng thể", GAMUDA_SRC, 11),
      media("media_elysian_site_hero2", "site", `${GAMUDA_GCS}/Elysian_Hero_GLVN_604d0f1d65.jpg`, "Elysian — media Gamuda Land", "Tiện ích — media CĐT", GAMUDA_SRC, 12),
      media("media_elysian_site_thumb2", "site", `${GAMUDA_GCS}/Elysian_Thumbnail_3f3a46095c_79e8f99503.webp`, "Elysian — hình CĐT", "Tiện ích — hình CĐT", GAMUDA_SRC, 13),
    ],
  },

  "vinhomes-grand-park": {
    coverUrl: `${WM}/c/ca/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh.jpg`,
    items: [
      media("media_vgp_hero", "perspective", `${WM}/c/ca/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh.jpg`, "Công viên Ánh Sáng — Vinhomes Grand Park", "Ảnh thực địa dự án", WM_SRC, 1),
      media("media_vgp_park2", "perspective", `${WM}/8/86/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh_%282%29.jpg`, "Công viên Ánh Sáng và phân khu The Beverly", "Ảnh thực địa", WM_SRC, 2),
      media("media_vgp_park3", "site", `${WM}/1/19/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh_%283%29.jpg`, "Công viên Ánh Sáng Vinhomes Grand Park", "Tiện ích — công viên", WM_SRC, 10),
      media("media_vgp_beach", "site", `${WM}/2/2c/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh_%284%29.jpg`, "Bãi biển nhân tạo Công viên Ánh Sáng", "Tiện ích — giải trí / mặt nước", WM_SRC, 11),
      media("media_vgp_park4", "site", `${WM}/c/ca/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh.jpg`, "Không gian xanh Grand Park", "Tiện ích — cảnh quan", WM_SRC, 12),
      media("media_vgp_park5", "site", `${WM}/8/86/C%C3%B4ng_vi%C3%AAn_%C3%81nh_S%C3%A1ng_Vinhomes_Grand_Park%2C_th%E1%BB%A7_%C4%91%E1%BB%A9c%2C_th%C3%A0nh_ph%E1%BB%91_h%E1%BB%93_ch%C3%AD_minh_%282%29.jpg`, "Cảnh quan The Beverly — Grand Park", "Tiện ích — phân khu", WM_SRC, 13),
    ],
  },

  "vinhomes-ocean-park": {
    coverUrl: `${OH}/media/Vinhomes%20Ocean%20Park/VHOP/AVATAR/du-an-vinhomes-ocean-park-2.jpg`,
    items: [
      media("media_vop_hero", "perspective", `${OH}/media/Vinhomes%20Ocean%20Park/VHOP/AVATAR/du-an-vinhomes-ocean-park-2.jpg`, "Vinhomes Ocean Park", "Phối cảnh / avatar dự án", OH_SRC, 1),
      media("media_vop_avatar", "perspective", `${OH}/media/Vinhomes%20Ocean%20Park/VHOP/AVATAR/du-an-vinhomes-ocean-park-1.jpg`, "Vinhomes Ocean Park — góc nhìn khác", "Phối cảnh dự án", OH_SRC, 2),
      media("media_vop_wm", "perspective", `${WM}/a/a2/The_grand_voyage_vinhomes_ocean_park_3.jpg`, "The Grand Voyage — Vinhomes Ocean Park", "Ảnh thực địa", WM_SRC, 3),
      media("media_vop_bridge", "site", `${WM}/b/b1/Cau_dong_tay_vhm_ocean_park_3.jpg`, "Cầu Đông Tây Grand World — Ocean Park", "Tiện ích — cảnh quan", WM_SRC, 10),
      media("media_vop_pool", "site", `${OH}/media/VHOP/The%20Sapphire/UTILITY/be-boi-cua-du-an-Vinhomes-Ocean-Park-The-Sapphire-1-3.jpg`, "Hồ bơi The Sapphire — Ocean Park", "Tiện ích — hồ bơi", OH_SRC, 11),
      media("media_vop_park", "site", `${OH}/media/VHOP/The%20Sapphire/UTILITY/cong-vien-cua-du-an-Vinhomes-Ocean-Park-The%20Sapphire-2-4.jpg`, "Công viên The Sapphire", "Tiện ích — công viên", OH_SRC, 12),
      media("media_vop_yoga", "site", `${OH}/media/VHOP/The%20Pavilion/UTILITY/dao-tap-yoga-cua-du-an-Vinhomes-Ocean-Park-The-Pavilion-1.jpg`, "Đảo tập yoga The Pavilion", "Tiện ích — thể thao", OH_SRC, 13),
      media("media_vop_play", "site", `${OH}/media/VHOP/The%20Pavilion/UTILITY/san-choi-tre-nho-cua-du-an-Vinhomes-Ocean-Park-The-Pavilion-3.jpg`, "Sân chơi trẻ nhỏ The Pavilion", "Tiện ích — sân chơi", OH_SRC, 14),
    ],
  },

  "vinhomes-smart-city": {
    coverUrl: `${OH}/media/VHSC/The%20Miami/AVATAR/phan-khu-The-Miami-Vinhomes-Smart-City-1.jpg`,
    items: [
      media("media_vsc_hero", "perspective", `${OH}/media/VHSC/The%20Miami/AVATAR/phan-khu-The-Miami-Vinhomes-Smart-City-1.jpg`, "The Miami — Vinhomes Smart City", "Phối cảnh phân khu", OH_SRC, 1),
      media("media_vsc_sakura", "perspective", `${OH}/media/VHSC/The%20Sakura/AVATAR/phan-khu-Vinhomes-Smart-City-The-Sakura-1.jpg`, "The Sakura — Smart City", "Phối cảnh phân khu", OH_SRC, 2),
      media("media_vsc_sapphire", "perspective", `${OH}/media/VHSC/The%20Sapphire/AVATAR/phan-khu-The-Sapphire-1_2-Vinhomes-Smart-City-1.jpg`, "The Sapphire — Smart City", "Phối cảnh phân khu", OH_SRC, 3),
      media("media_vsc_pool", "site", `${OH}/media/VHSC/The%20Miami/UTILITY/be-boi-cua-phan-khu-The-Miami-Vinhomes-Smart-City-1.jpg`, "Hồ bơi The Miami", "Tiện ích — hồ bơi", OH_SRC, 10),
      media("media_vsc_gym", "site", `${OH}/media/VHSC/The%20Miami/UTILITY/san-tap-gym-cua-phan-khu-The-Miami-Vinhomes-Smart-City-2.jpg`, "Sân tập gym The Miami", "Tiện ích — gym", OH_SRC, 11),
      media("media_vsc_sport", "site", `${OH}/media/VHSC/The%20Miami/UTILITY/san-the-thao-cua-phan-khu-The-Miami-Vinhomes-Smart-City-3.jpg`, "Sân thể thao The Miami", "Tiện ích — thể thao", OH_SRC, 12),
      media("media_vsc_shop", "site", `${OH}/media/VHSC/The%20Sapphire/UTILITY/shop-thuong-mai-dich-vu-cua-phan-khu-The-Sapphire-Vinhomes-Smart-City-3.jpg`, "Shophouse / thương mại The Sapphire", "Tiện ích — thương mại", OH_SRC, 13),
      media("media_vsc_play", "site", `${OH}/media/VHSC/The%20Sapphire/UTILITY/san-choi-tre-nho-cua-phan-khu-The-Sapphire-Vinhomes-Smart-City-4.jpg`, "Sân chơi trẻ nhỏ The Sapphire", "Tiện ích — sân chơi", OH_SRC, 14),
    ],
  },

  ecopark: {
    coverUrl: `${ECOPARK}/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg`,
    items: [
      media("media_ecopark_hero", "perspective", `${ECOPARK}/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg`, "Ecopark Sky Forest", "Phối cảnh / quang cảnh Ecopark", ECOPARK_SRC, 1),
      media("media_ecopark_landmark", "perspective", `${ECOPARK}/images/slideshow/2021/08/10/original/thelandmark-homepage_1628581276.jpg`, "The Landmark Ecopark", "Phối cảnh The Landmark", ECOPARK_SRC, 2),
      media("media_ecopark_gallery", "perspective", `${ECOPARK}/images/gallery/2023/06/27/resize_home/351108925_2843611302436818_5505970865256659562_n_1687848852.jpg`, "Thư viện ảnh Ecopark", "Ảnh thực tế / CĐT", ECOPARK_SRC, 3),
      media("media_ecopark_swan", "site", `${ECOPARK}/images/open_sale/cat/2021/07/resize/swanlake_1625925951.jpg`, "Swanlake Residences", "Tiện ích — phân khu mặt nước", ECOPARK_SRC, 10),
      media("media_ecopark_sol", "site", `${ECOPARK}/images/open_sale/cat/2020/12/resize/solforest2_1607939008.jpg`, "Sol Forest", "Tiện ích — không gian xanh", ECOPARK_SRC, 11),
      media("media_ecopark_mariana", "site", `${ECOPARK}/images/open_sale/cat/2021/03/resize/mariana_1615050281.jpg`, "Mariana", "Tiện ích — phân khu", ECOPARK_SRC, 12),
      media("media_ecopark_amen1", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich1_1625926805.jpg`, "Tiện ích nội khu Ecopark", "Tiện ích — nội khu", ECOPARK_SRC, 13),
      media("media_ecopark_amen2", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich2_1625926828.jpg`, "Tiện ích Ecopark (2)", "Tiện ích — nội khu", ECOPARK_SRC, 14),
      media("media_ecopark_amen3", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich3_1625926846.jpg`, "Tiện ích Ecopark (3)", "Tiện ích — nội khu", ECOPARK_SRC, 15),
      media("media_ecopark_amen4", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich4_1625926776.jpg`, "Tiện ích Ecopark (4)", "Tiện ích — nội khu", ECOPARK_SRC, 16),
    ],
  },

  "ecopark-aqua-bay": {
    coverUrl: `${ECOPARK}/images/open_sale/cat/2021/07/resize/swanlake_1625925951.jpg`,
    items: [
      media("media_aqua_hero", "perspective", `${ECOPARK}/images/open_sale/cat/2021/07/resize/swanlake_1625925951.jpg`, "Swanlake / mặt nước Ecopark", "Phối cảnh mặt nước", ECOPARK_SRC, 1),
      media("media_aqua_sky", "perspective", `${ECOPARK}/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg`, "Sky Forest cạnh khu mặt nước", "Phối cảnh tháp", ECOPARK_SRC, 2),
      media("media_aqua_street", "perspective", `${ECOPARK}/images/open_sale/2022/03/large/220126_eco-ct06_v09_street-view_draft-1_1647056054.jpg`, "Street view Ecopark", "Phối cảnh đường nội khu", ECOPARK_SRC, 3),
      media("media_aqua_amen1", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich1_1625926805.jpg`, "Tiện ích ven vịnh / nội khu", "Tiện ích — nội khu", ECOPARK_SRC, 10),
      media("media_aqua_amen2", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich2_1625926828.jpg`, "Tiện ích Aqua / Swanlake", "Tiện ích — nghỉ dưỡng", ECOPARK_SRC, 11),
      media("media_aqua_amen3", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich3_1625926846.jpg`, "Tiện ích thể thao / giải trí", "Tiện ích — thể thao", ECOPARK_SRC, 12),
      media("media_aqua_amen4", "site", `${ECOPARK}/images/open_sale/2021/07/larger/w_tienich4_1625926776.jpg`, "Tiện ích cảnh quan", "Tiện ích — cảnh quan", ECOPARK_SRC, 13),
      media("media_aqua_landmark", "site", `${ECOPARK}/images/slideshow/2021/08/10/original/thelandmark-homepage_1628581276.jpg`, "The Landmark trong đô thị Ecopark", "Tiện ích — biểu tượng đô thị", ECOPARK_SRC, 14),
    ],
  },

  "opal-boulevard": {
    coverUrl: `${OPAL_WA}/Data/Sites/1/Banner/bg_banner_12.jpg`,
    items: [
      media("media_opal_hero", "perspective", `${OPAL_WA}/Data/Sites/1/Banner/bg_banner_12.jpg`, "Banner Opal Boulevard (CĐT)", "Phối cảnh / banner", OPAL_SRC, 1),
      media("media_opal_lux1", "perspective", `${OPAL_WA}/Data/Sites/1/media/default/img/bg_luxury01.jpg`, "Opal Boulevard — hình CĐT 1", "Phối cảnh", OPAL_SRC, 2),
      media("media_opal_lux2", "perspective", `${OPAL_WA}/Data/Sites/1/media/default/img/bg_luxury02.jpg`, "Opal Boulevard — hình CĐT 2", "Phối cảnh", OPAL_SRC, 3),
      media("media_opal_lux3", "site", `${OPAL_WA}/Data/Sites/1/media/default/img/bg_luxury03.jpg`, "Opal Boulevard — hình CĐT 3", "Tiện ích / không gian", OPAL_SRC, 10),
      media("media_opal_news1", "site", `${OPAL_WA}/Data/Sites/1/News/1235/opb-b2-h3.jpg`, "Tiến độ / thực tế Opal Boulevard", "Tiện ích — hiện trạng", OPAL_SRC, 11),
      media("media_opal_news2", "site", `${OPAL_WA}/Data/Sites/1/News/1236/opb-b3-h2.jpg`, "Hạng mục Opal Boulevard", "Tiện ích — công trình", OPAL_SRC, 12),
      media("media_opal_banner", "site", `${OPAL_WA}/Data/Sites/1/Banner/bg_banner_12.jpg`, "Tổng thể Opal Boulevard", "Tiện ích — tổng thể", OPAL_SRC, 13),
    ],
  },

  "the-prive": {
    coverUrl: `${PRIVE}/2025/05/tong-quan.jpg`,
    items: [
      media("media_prive_hero", "perspective", `${PRIVE}/2025/05/tong-quan.jpg`, "Tổng quan The Privé", "Phối cảnh tổng thể", PRIVE_SRC, 1),
      media("media_prive_lobby", "perspective", `${PRIVE}/2025/05/TPV-SANH-CHINH-LOBBY.jpg`, "Sảnh chính / lobby The Privé", "Phối cảnh nội thất CĐT", PRIVE_SRC, 2),
      media("media_prive_amen1", "site", `${PRIVE}/2025/05/tien-ich-1.jpg`, "Tiện ích The Privé (1)", "Tiện ích — nội khu", PRIVE_SRC, 10),
      media("media_prive_amen2", "site", `${PRIVE}/2025/05/tien-ich-2-3-new.jpg`, "Tiện ích The Privé (2)", "Tiện ích — nội khu", PRIVE_SRC, 11),
      media("media_prive_amen3", "site", `${PRIVE}/2025/05/tien-ich-4.jpg`, "Tiện ích The Privé (3)", "Tiện ích — nội khu", PRIVE_SRC, 12),
      media("media_prive_gym", "site", `${PRIVE}/2025/05/TPV-THE-GRAND-GYM.jpg`, "The Grand Gym", "Tiện ích — gym", PRIVE_SRC, 13),
      media("media_prive_pool", "site", `${PRIVE}/2025/06/Azura-pool_s.jpg`, "Hồ bơi Azura", "Tiện ích — hồ bơi", PRIVE_SRC, 14),
      media("media_prive_play", "site", `${PRIVE}/2025/05/TPV-SAN-CHOI-TRE-EM.jpg`, "Sân chơi trẻ em", "Tiện ích — sân chơi", PRIVE_SRC, 15),
    ],
  },
};

export function mediaSeedForSlug(slug: string): ProjectMediaSeed | undefined {
  return PROJECT_MEDIA_SEEDS[slug];
}
