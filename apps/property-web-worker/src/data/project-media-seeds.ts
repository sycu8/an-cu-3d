/**
 * Curated project cover + gallery media seeds.
 * Celadon City: official assets from https://celadoncityhcm.com/
 * (phối cảnh, mặt bằng 2D, công viên, trường học, AEON, clubhouse, y tế…).
 * Other projects: distinct covers + full amenity galleries (labeled stand-ins until crawl/R2).
 */

import type { ProjectMediaItem } from "../types";

export type ProjectMediaSeed = {
  coverUrl: string;
  items: ProjectMediaItem[];
};

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

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1400&q=80`;
}

function amenityPack(
  prefix: string,
  photos: { park: string; school: string; commerce: string; leisure: string; landscape: string },
  provenance = "Unsplash — minh họa chờ crawl CĐT",
): ProjectMediaItem[] {
  return [
    media(`${prefix}_park`, "site", unsplash(photos.park), "Công viên / không gian xanh (minh họa)", "Tiện ích — công viên", provenance, 10, "estimated"),
    media(`${prefix}_school`, "site", unsplash(photos.school), "Trường học / giáo dục (minh họa)", "Tiện ích — trường học", provenance, 11, "estimated"),
    media(`${prefix}_commerce`, "site", unsplash(photos.commerce), "Tiện ích thương mại (minh họa)", "Tiện ích — mua sắm", provenance, 12, "estimated"),
    media(`${prefix}_leisure`, "site", unsplash(photos.leisure), "Hồ bơi / thể thao / nghỉ dưỡng (minh họa)", "Tiện ích — thể thao / hồ bơi", provenance, 13, "estimated"),
    media(`${prefix}_landscape`, "site", unsplash(photos.landscape), "Quang cảnh / mặt nước (minh họa)", "Tiện ích — quang cảnh", provenance, 14, "estimated"),
  ];
}

const CELADON = "https://celadoncityhcm.com/wp-content/uploads";
const CELADON_SRC = "https://celadoncityhcm.com/";

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
    coverUrl: unsplash("photo-1545324418-cc1a3fa10c00"),
    items: [
      media("media_eaton_hero", "perspective", unsplash("photo-1545324418-cc1a3fa10c00"), "Phối cảnh cao ốc Eaton Park (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Gamuda Land", 1, "estimated"),
      media("media_eaton_ext", "perspective", unsplash("photo-1486406146926-c627a92ad1ab"), "Mặt ngoài tháp (minh họa)", "Phối cảnh tháp", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_eaton", {
        park: "photo-1580587771525-78b9dba3b914",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1441986300917-64674bd600d8",
        leisure: "photo-1576013551627-0cc20b96c2a7",
        landscape: "photo-1441974231531-c6227db76b6e",
      }),
    ],
  },

  elysian: {
    coverUrl: unsplash("photo-1600607687939-ce8a6c25118c"),
    items: [
      media("media_elysian_hero", "perspective", unsplash("photo-1600607687939-ce8a6c25118c"), "Phối cảnh Elysian (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Gamuda Land", 1, "estimated"),
      media("media_elysian_sky", "perspective", unsplash("photo-1493809842364-78817add7ffb"), "Phối cảnh căn hộ (minh họa)", "Phối cảnh không gian sống", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_elysian", {
        park: "photo-1441974231531-c6227db76b6e",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1555529902-5261145633bf",
        leisure: "photo-1571902943202-507ec2618e8f",
        landscape: "photo-1558618666-fcd25c85cd64",
      }),
    ],
  },

  "vinhomes-grand-park": {
    coverUrl: unsplash("photo-1460317442991-0ec209397118"),
    items: [
      media("media_vgp_hero", "perspective", unsplash("photo-1460317442991-0ec209397118"), "Phối cảnh đại đô thị (minh họa Grand Park)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Vinhomes", 1, "estimated"),
      media("media_vgp_tower", "perspective", unsplash("photo-1545324418-cc1a3fa10c00"), "Tháp căn hộ (minh họa)", "Phối cảnh tháp", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_vgp", {
        park: "photo-1558618666-fcd25c85cd64",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1441986300917-64674bd600d8",
        leisure: "photo-1571902943202-507ec2618e8f",
        landscape: "photo-1439066615861-d1af74d74000",
      }),
      media("media_vgp_health", "site", unsplash("photo-1519494026892-80bbd2d6fd0d"), "Y tế nội khu (minh họa Vinmec)", "Tiện ích — y tế", "Unsplash — minh họa", 15, "estimated"),
    ],
  },

  "vinhomes-ocean-park": {
    coverUrl: unsplash("photo-1512917774080-9991f1c4c750"),
    items: [
      media("media_vop_hero", "perspective", unsplash("photo-1512917774080-9991f1c4c750"), "Phối cảnh thấp tầng (minh họa Ocean Park)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Vinhomes", 1, "estimated"),
      media("media_vop_house", "perspective", unsplash("photo-1564013799919-ab600027ffc6"), "Biệt thự / thấp tầng (minh họa)", "Phối cảnh nhà thấp tầng", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_vop", {
        park: "photo-1506905925346-21bda4d32df4",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1441986300917-64674bd600d8",
        leisure: "photo-1576013551627-0cc20b96c2a7",
        landscape: "photo-1439066615861-d1af74d74000",
      }),
      media("media_vop_health", "site", unsplash("photo-1582719478250-c89cae4dc85b"), "Y tế nội khu (minh họa)", "Tiện ích — y tế", "Unsplash — minh họa", 15, "estimated"),
    ],
  },

  "vinhomes-smart-city": {
    coverUrl: unsplash("photo-1493809842364-78817add7ffb"),
    items: [
      media("media_vsc_hero", "perspective", unsplash("photo-1493809842364-78817add7ffb"), "Phối cảnh căn hộ Smart City (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Vinhomes", 1, "estimated"),
      media("media_vsc_ext", "perspective", unsplash("photo-1600585154340-be6161a56a0c"), "Mặt ngoài (minh họa)", "Phối cảnh kiến trúc", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_vsc", {
        park: "photo-1441974231531-c6227db76b6e",
        school: "photo-1580587771525-78b9dba3b914",
        commerce: "photo-1555529902-5261145633bf",
        leisure: "photo-1540497077202-7c8a3999166f",
        landscape: "photo-1558618666-fcd25c85cd64",
      }),
    ],
  },

  ecopark: {
    coverUrl: "https://ecopark.com.vn/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg",
    items: [
      media("media_ecopark_hero", "perspective", "https://ecopark.com.vn/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg", "Ecopark Sky Forest", "Phối cảnh / quang cảnh Ecopark", "https://ecopark.com.vn/", 1),
      media("media_ecopark_landmark", "perspective", "https://ecopark.com.vn/images/slideshow/2021/08/10/original/thelandmark-homepage_1628581276.jpg", "The Landmark Ecopark", "Phối cảnh The Landmark", "https://ecopark.com.vn/", 2),
      ...amenityPack(
        "media_ecopark",
        {
          park: "photo-1441974231531-c6227db76b6e",
          school: "photo-1497633762265-9d179a990aa6",
          commerce: "photo-1441986300917-64674bd600d8",
          leisure: "photo-1551882547-ff40c63fe5fa",
          landscape: "photo-1439066615861-d1af74d74000",
        },
        "Unsplash — minh họa bổ sung cho tiện ích Ecopark",
      ),
      media("media_ecopark_health", "site", unsplash("photo-1519494026892-80bbd2d6fd0d"), "Y tế nội khu (minh họa)", "Tiện ích — y tế", "Unsplash — minh họa", 15, "estimated"),
    ],
  },

  "ecopark-aqua-bay": {
    coverUrl: unsplash("photo-1560448204-e02f11c3d0e2"),
    items: [
      media("media_aqua_hero", "perspective", unsplash("photo-1560448204-e02f11c3d0e2"), "Phối cảnh Aqua Bay (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Ecopark", 1, "estimated"),
      media("media_aqua_view", "perspective", unsplash("photo-1600566753190-17f0baa2a6c3"), "View tháp / vịnh (minh họa)", "Phối cảnh view", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_aqua", {
        park: "photo-1558618666-fcd25c85cd64",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1555529902-5261145633bf",
        leisure: "photo-1576013551627-0cc20b96c2a7",
        landscape: "photo-1439066615861-d1af74d74000",
      }),
    ],
  },

  "opal-boulevard": {
    coverUrl: unsplash("photo-1522708323590-d24dbb6b0267"),
    items: [
      media("media_opal_hero", "perspective", unsplash("photo-1522708323590-d24dbb6b0267"), "Không gian sống Opal Boulevard (minh họa)", "Phối cảnh nội thất", "Unsplash — minh họa chờ crawl Đất Xanh", 1, "estimated"),
      media("media_opal_ext", "perspective", unsplash("photo-1600607687939-ce8a6c25118c"), "Mặt ngoài (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_opal", {
        park: "photo-1441974231531-c6227db76b6e",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1441986300917-64674bd600d8",
        leisure: "photo-1571902943202-507ec2618e8f",
        landscape: "photo-1580587771525-78b9dba3b914",
      }),
    ],
  },

  "the-prive": {
    coverUrl: unsplash("photo-1502672260266-1c1ef2d93688"),
    items: [
      media("media_prive_hero", "perspective", unsplash("photo-1502672260266-1c1ef2d93688"), "Không gian sống The Privé (minh họa)", "Phối cảnh nội thất", "Unsplash — minh họa chờ crawl Bluemarq", 1, "estimated"),
      media("media_prive_ext", "perspective", unsplash("photo-1600566753190-17f0baa2a6c3"), "Mặt ngoài (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa", 2, "estimated"),
      ...amenityPack("media_prive", {
        park: "photo-1441974231531-c6227db76b6e",
        school: "photo-1497633762265-9d179a990aa6",
        commerce: "photo-1555529902-5261145633bf",
        leisure: "photo-1576013551627-0cc20b96c2a7",
        landscape: "photo-1439066615861-d1af74d74000",
      }),
    ],
  },
};

export function mediaSeedForSlug(slug: string): ProjectMediaSeed | undefined {
  return PROJECT_MEDIA_SEEDS[slug];
}
