/**
 * Curated project cover + gallery media seeds.
 * Celadon City uses official assets from https://celadoncityhcm.com/
 * Other projects use distinct working images (official where available, else labeled Unsplash stand-ins)
 * until allowlisted crawl / R2 fills production media.
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

export const PROJECT_MEDIA_SEEDS: Record<string, ProjectMediaSeed> = {
  "celadon-city": {
    coverUrl: "https://celadoncityhcm.com/wp-content/uploads/2020/12/98000254_101754371555953_4289346695638024192_o.jpg",
    items: [
      media("media_celadon_atlas", "atlas", "https://celadoncityhcm.com/wp-content/uploads/2020/05/Overview.jpg", "Tổng quan Celadon City", "Atlas / tổng quan quy hoạch", "https://celadoncityhcm.com/", 0),
      media("media_celadon_hero", "perspective", "https://celadoncityhcm.com/wp-content/uploads/2020/12/98000254_101754371555953_4289346695638024192_o.jpg", "Phối cảnh tổng thể Celadon City", "Phối cảnh dự án", "https://celadoncityhcm.com/", 1),
      media("media_celadon_diamond", "perspective", "https://celadoncityhcm.com/wp-content/uploads/2021/12/diamond1.jpg", "Phân khu Diamond — Celadon City", "Phối cảnh phân khu Diamond", "https://celadoncityhcm.com/", 2),
      media("media_celadon_ruby", "perspective", "https://celadoncityhcm.com/wp-content/uploads/2017/11/ruby-1920x1216-1.jpg", "Phân khu Ruby — Celadon City", "Phối cảnh phân khu Ruby", "https://celadoncityhcm.com/", 3),
      media("media_celadon_elevation", "elevation", "https://celadoncityhcm.com/wp-content/uploads/2018/12/181129_GAMUDA_DIAMONCITY_FACADE-VIEW-2_Final_LOGO.jpg", "Mặt đứng Diamond City", "Hình 2D / mặt đứng", "https://celadoncityhcm.com/", 4),
      media("media_celadon_floorplan", "floorplan_2d", "https://celadoncityhcm.com/wp-content/uploads/2018/11/dmbr.png", "Sơ đồ phân khu Celadon City", "Hình 2D / sơ đồ", "https://celadoncityhcm.com/", 5),
      media("media_celadon_aeon", "site", "https://celadoncityhcm.com/wp-content/uploads/2020/05/AM-Tan-Phu-Celadon-1-scaled.jpg", "AEON Mall Tân Phú Celadon", "Tiện ích — trung tâm thương mại", "https://celadoncityhcm.com/", 10),
      media("media_celadon_park", "site", "https://celadoncityhcm.com/wp-content/uploads/2018/10/3904-1920.jpg", "Công viên sinh thái Celadon City", "Tiện ích — công viên / quang cảnh", "https://celadoncityhcm.com/", 11),
      media("media_celadon_school", "site", "https://celadoncityhcm.com/wp-content/uploads/2018/10/57.jpg", "Hệ thống giáo dục tại Celadon City", "Tiện ích — trường học", "https://celadoncityhcm.com/", 12),
      media("media_celadon_sports", "site", "https://celadoncityhcm.com/wp-content/uploads/2018/10/40595135_2203235536588207_979723563961417728_n.jpg", "Celadon Sports & Resort Club", "Tiện ích — thể thao", "https://celadoncityhcm.com/", 13),
      media("media_celadon_clinic", "site", "https://celadoncityhcm.com/wp-content/uploads/2018/10/Ph%C3%B2ng-kh%C3%A1m-Ho%C3%A0n-M%E1%BB%B9.jpg", "Phòng khám Hoàn Mỹ — Celadon City", "Tiện ích — y tế", "https://celadoncityhcm.com/", 14),
      media("media_celadon_boulevard", "site", "https://celadoncityhcm.com/wp-content/uploads/2018/10/z1043993066070_858dba5292ba5b5f70c4c43046ff8919.jpg", "Đại lộ Gamuda — Celadon City", "Tiện ích — cảnh quan nội khu", "https://celadoncityhcm.com/", 15),
    ],
  },
  "eaton-park": {
    coverUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_eaton_hero", "perspective", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80", "Phối cảnh cao ốc Eaton Park (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl CĐT", 1, "estimated"),
      media("media_eaton_park", "site", "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80", "Công viên nội khu (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 10, "estimated"),
      media("media_eaton_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học lân cận (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 11, "estimated"),
      media("media_eaton_mall", "site", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80", "Tiện ích thương mại (minh họa)", "Tiện ích — mua sắm", "Unsplash — minh họa", 12, "estimated"),
    ],
  },
  elysian: {
    coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_elysian_hero", "perspective", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80", "Phối cảnh Elysian (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl CĐT", 1, "estimated"),
      media("media_elysian_pool", "site", "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1400&q=80", "Hồ bơi / tiện ích (minh họa)", "Tiện ích — hồ bơi", "Unsplash — minh họa", 10, "estimated"),
      media("media_elysian_park", "site", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80", "Quang cảnh xanh (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 11, "estimated"),
      media("media_elysian_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 12, "estimated"),
    ],
  },
  "vinhomes-grand-park": {
    coverUrl: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_vgp_hero", "perspective", "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80", "Phối cảnh đại đô thị (minh họa Grand Park)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Vinhomes", 1, "estimated"),
      media("media_vgp_park", "site", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=80", "Công viên lớn (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 10, "estimated"),
      media("media_vgp_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 11, "estimated"),
      media("media_vgp_lake", "site", "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80", "Mặt nước / công viên (minh họa)", "Tiện ích — quang cảnh", "Unsplash — minh họa", 12, "estimated"),
    ],
  },
  "vinhomes-ocean-park": {
    coverUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_vop_hero", "perspective", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80", "Phối cảnh thấp tầng (minh họa Ocean Park)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Vinhomes", 1, "estimated"),
      media("media_vop_lake", "site", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80", "Hồ / quang cảnh (minh họa)", "Tiện ích — mặt nước", "Unsplash — minh họa", 10, "estimated"),
      media("media_vop_mall", "site", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80", "TTTM (minh họa)", "Tiện ích — mua sắm", "Unsplash — minh họa", 11, "estimated"),
      media("media_vop_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 12, "estimated"),
    ],
  },
  "vinhomes-smart-city": {
    coverUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_vsc_hero", "perspective", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80", "Phối cảnh căn hộ Smart City (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Vinhomes", 1, "estimated"),
      media("media_vsc_park", "site", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80", "Công viên nội khu (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 10, "estimated"),
      media("media_vsc_school", "site", "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80", "Không gian cộng đồng / giáo dục (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 11, "estimated"),
      media("media_vsc_mall", "site", "https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=1400&q=80", "Tiện ích thương mại (minh họa)", "Tiện ích — mua sắm", "Unsplash — minh họa", 12, "estimated"),
    ],
  },
  ecopark: {
    coverUrl: "https://ecopark.com.vn/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg",
    items: [
      media("media_ecopark_hero", "perspective", "https://ecopark.com.vn/images/slideshow/2022/03/11/original/kv-skyforest-01_1646974489.jpg", "Ecopark Sky Forest", "Phối cảnh / quang cảnh Ecopark", "https://ecopark.com.vn/", 1),
      media("media_ecopark_landmark", "perspective", "https://ecopark.com.vn/images/slideshow/2021/08/10/original/thelandmark-homepage_1628581276.jpg", "The Landmark Ecopark", "Phối cảnh The Landmark", "https://ecopark.com.vn/", 2),
      media("media_ecopark_park", "site", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80", "Công viên Ecopark (minh họa bổ sung)", "Tiện ích — công viên", "Unsplash — minh họa bổ sung", 10, "estimated"),
      media("media_ecopark_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 11, "estimated"),
    ],
  },
  "ecopark-aqua-bay": {
    coverUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_aqua_hero", "perspective", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80", "Phối cảnh Aqua Bay (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa chờ crawl Ecopark", 1, "estimated"),
      media("media_aqua_water", "site", "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80", "Mặt nước / bay (minh họa)", "Tiện ích — mặt nước", "Unsplash — minh họa", 10, "estimated"),
      media("media_aqua_park", "site", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=80", "Công viên (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 11, "estimated"),
      media("media_aqua_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 12, "estimated"),
    ],
  },
  "opal-boulevard": {
    coverUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_opal_hero", "perspective", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80", "Không gian sống Opal Boulevard (minh họa)", "Phối cảnh nội thất", "Unsplash — minh họa chờ crawl Đất Xanh", 1, "estimated"),
      media("media_opal_ext", "perspective", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80", "Mặt ngoài (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa", 2, "estimated"),
      media("media_opal_park", "site", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80", "Công viên (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 10, "estimated"),
      media("media_opal_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 11, "estimated"),
    ],
  },
  "the-prive": {
    coverUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
    items: [
      media("media_prive_hero", "perspective", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80", "Không gian sống The Privé (minh họa)", "Phối cảnh nội thất", "Unsplash — minh họa chờ crawl Bluemarq", 1, "estimated"),
      media("media_prive_ext", "perspective", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80", "Mặt ngoài (minh họa)", "Phối cảnh tổng thể", "Unsplash — minh họa", 2, "estimated"),
      media("media_prive_park", "site", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80", "Công viên (minh họa)", "Tiện ích — công viên", "Unsplash — minh họa", 10, "estimated"),
      media("media_prive_school", "site", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80", "Trường học (minh họa)", "Tiện ích — giáo dục", "Unsplash — minh họa", 11, "estimated"),
    ],
  },
};

export function mediaSeedForSlug(slug: string): ProjectMediaSeed | undefined {
  return PROJECT_MEDIA_SEEDS[slug];
}
