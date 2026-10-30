export type PCOperatingSystem = "windows10" | "windows11" | "linux" | "macos" | "unknown";
export type PCStorageType = "ssd" | "hdd" | "unknown";
export type HardwareAssessment = "unknown" | "below-minimum" | "minimum" | "recommended";
export type RequirementCheckStatus = "unknown" | "not-published" | "below-minimum" | "minimum" | "recommended";

export type PCBuildProfile = {
  cpuModel: string;
  gpuModel: string;
  ramGb: number | null;
  vramGb: number | null;
  freeStorageGb: number | null;
  storageType: PCStorageType;
  os: PCOperatingSystem;
  resolution: "1080p" | "1440p" | "2160p";
  targetFps: 30 | 60 | 120 | 144;
};

export type PCGameTier = {
  cpu: string;
  gpu: string;
  ramGb: number;
  vramGb?: number;
  storageGb?: number;
  requiresSsd?: boolean;
};

export type PCGameRequirement = {
  slug: string;
  title: string;
  category: string;
  minimum: PCGameTier;
  recommended?: PCGameTier;
  osLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  checkedAt: string;
  officialPerformanceNote?: string;
  caveat?: string;
};

export type RequirementCheck = {
  id: string;
  label: string;
  actual: string;
  minimum: string;
  recommended: string;
  status: RequirementCheckStatus;
  detail: string;
  affectsPerformanceTier: boolean;
};

export type PCCompatibilityReport = {
  status: "below-minimum" | "needs-verification" | "minimum-met" | "recommended";
  checks: RequirementCheck[];
  issues: string[];
  recommendedAvailable: boolean;
};

export const PC_BUILD_GUEST_STORAGE_KEY = "levelup:pc-build:v1";
export const PC_BUILD_USER_STORAGE_PREFIX = "levelup:pc-build:user:v1:";

export const defaultPCBuildProfile: PCBuildProfile = {
  cpuModel: "",
  gpuModel: "",
  ramGb: null,
  vramGb: null,
  freeStorageGb: null,
  storageType: "unknown",
  os: "windows11",
  resolution: "1080p",
  targetFps: 60,
};

export const pcGameRequirements: PCGameRequirement[] = [
  {
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    category: "OPEN WORLD / RPG",
    minimum: {
      cpu: "Intel Core i7-6700 / AMD Ryzen 5 1600",
      gpu: "GeForce GTX 1060 6 GB / Radeon RX 580 8 GB / Intel Arc A380",
      ramGb: 12,
      vramGb: 6,
      storageGb: 70,
      requiresSsd: true,
    },
    recommended: {
      cpu: "Intel Core i7-12700 / AMD Ryzen 7 7800X3D",
      gpu: "GeForce RTX 2060 SUPER / Radeon RX 5700 XT / Intel Arc A770",
      ramGb: 16,
      vramGb: 8,
      storageGb: 70,
      requiresSsd: true,
    },
    osLabel: "Windows 10 64-bit (DirectX 12)",
    sourceLabel: "CD PROJEKT RED — System Requirements",
    sourceUrl: "https://support.cdprojektred.com/en/cyberpunk/pc/sp-technical/issue/1556/cyberpunk-2077-system-requirements",
    checkedAt: "2026-10-30",
    officialPerformanceNote: "Nhà phát triển công bố mức tối thiểu ở 1080p / Low / 30 FPS và mức khuyến nghị ở 1080p / High / 60 FPS. Đây là cấu hình tham chiếu của nhà phát triển, không phải benchmark cho mọi máy.",
    caveat: "Ray tracing có bộ yêu cầu riêng cao hơn; bảng này chỉ đối chiếu cấu hình không bật ray tracing.",
  },
  {
    slug: "pubg-battlegrounds",
    title: "PUBG: BATTLEGROUNDS",
    category: "BATTLE ROYALE / FPS",
    minimum: {
      cpu: "Intel Core i5-4430 / AMD FX-6300",
      gpu: "GeForce GTX 960 2 GB / Radeon R7 370 2 GB",
      ramGb: 8,
      vramGb: 2,
      storageGb: 40,
    },
    recommended: {
      cpu: "Intel Core i5-6600K / AMD Ryzen 5 1600",
      gpu: "GeForce GTX 1060 3 GB / Radeon RX 580 4 GB",
      ramGb: 16,
      vramGb: 4,
      storageGb: 50,
    },
    osLabel: "Windows 10 64-bit / DirectX 11",
    sourceLabel: "Steam Support — PUBG: BATTLEGROUNDS",
    sourceUrl: "https://help.steampowered.com/vn/wizard/HelpWithGameTechnicalIssue/?appid=578080",
    checkedAt: "2026-10-30",
    officialPerformanceNote: "Trang hỗ trợ PUBG mô tả cấu hình khuyến nghị cho khoảng 144 FPS trong phần lớn tình huống; kết quả thực tế thay đổi theo bản cập nhật, bản đồ và thiết lập.",
  },
  {
    slug: "elden-ring",
    title: "ELDEN RING",
    category: "ACTION RPG",
    minimum: {
      cpu: "Intel Core i5-8400 / AMD Ryzen 3 3300X",
      gpu: "GeForce GTX 1060 3 GB / Radeon RX 580 4 GB",
      ramGb: 12,
      vramGb: 3,
      storageGb: 60,
    },
    recommended: {
      cpu: "Intel Core i7-8700K / AMD Ryzen 5 3600X",
      gpu: "GeForce GTX 1070 8 GB / Radeon RX Vega 56 8 GB",
      ramGb: 16,
      vramGb: 8,
      storageGb: 60,
    },
    osLabel: "Windows 10/11 64-bit",
    sourceLabel: "Steam Support — ELDEN RING",
    sourceUrl: "https://help.steampowered.com/en/wizard/HelpWithGameTechnicalIssue?appid=1245620",
    checkedAt: "2026-10-30",
  },
  {
    slug: "baldurs-gate-3",
    title: "Baldur's Gate 3",
    category: "CRPG / STORY",
    minimum: {
      cpu: "Intel Core i5-4690 / AMD FX-8350",
      gpu: "GeForce GTX 970 / Radeon RX 480 (4 GB+ VRAM)",
      ramGb: 8,
      vramGb: 4,
      storageGb: 150,
      requiresSsd: true,
    },
    recommended: {
      cpu: "Intel Core i7-8700K / AMD Ryzen 5 3600",
      gpu: "GeForce RTX 2060 SUPER / Radeon RX 5700 XT (8 GB+ VRAM)",
      ramGb: 16,
      vramGb: 8,
      storageGb: 150,
      requiresSsd: true,
    },
    osLabel: "Windows 10 64-bit",
    sourceLabel: "Larian Studios — System Requirements",
    sourceUrl: "https://baldursgate3.game/support/system-requirements_47",
    checkedAt: "2026-10-30",
  },
  {
    slug: "apex-legends",
    title: "Apex Legends",
    category: "BATTLE ROYALE / FPS",
    minimum: {
      cpu: "Intel Core i3-6300 / AMD FX-4350",
      gpu: "GeForce GTX 950 / Radeon HD 7790 2 GB",
      ramGb: 6,
      vramGb: 2,
      storageGb: 75,
    },
    recommended: {
      cpu: "Intel Core i5-3570K / AMD Ryzen 5 class",
      gpu: "GeForce GTX 970 / Radeon R9 290",
      ramGb: 8,
      storageGb: 75,
    },
    osLabel: "Windows 10 64-bit / DirectX 12",
    sourceLabel: "Electronic Arts — Apex Legends PC Requirements",
    sourceUrl: "https://www.ea.com/games/apex-legends/apex-legends/buy",
    checkedAt: "2026-10-30",
  },
  {
    slug: "counter-strike-2",
    title: "Counter-Strike 2",
    category: "COMPETITIVE FPS",
    minimum: {
      cpu: "Intel Core i5-750 or equivalent (4 hardware threads)",
      gpu: "DirectX 11-compatible GPU with Shader Model 5.0 and at least 1 GB VRAM",
      ramGb: 8,
      vramGb: 1,
      storageGb: 85,
    },
    osLabel: "Windows 10 / SteamOS + Linux (x64)",
    sourceLabel: "Steam Store — Counter-Strike 2",
    sourceUrl: "https://store.steampowered.com/app/730/CounterStrike_2/",
    checkedAt: "2026-10-30",
    caveat: "Nhà phát hành không công bố cấu hình khuyến nghị trong trang yêu cầu hệ thống được tham chiếu.",
  },
  {
    slug: "dota-2",
    title: "Dota 2",
    category: "MOBA / COMPETITIVE",
    minimum: {
      cpu: "Dual-core Intel or AMD at 2.8 GHz",
      gpu: "NVIDIA GeForce 8600/9600 GT or ATI/AMD Radeon HD 2600/3600",
      ramGb: 4,
      storageGb: 60,
    },
    osLabel: "Windows 7 or newer; separate Linux/macOS requirements exist",
    sourceLabel: "Steam Support — Dota 2",
    sourceUrl: "https://help.steampowered.com/en/wizard/HelpWithGameTechnicalIssue?appid=570",
    checkedAt: "2026-10-30",
    caveat: "Nhà phát hành không công bố cấu hình khuyến nghị trong trang yêu cầu hệ thống được tham chiếu.",
  },
  {
    slug: "stardew-valley",
    title: "Stardew Valley",
    category: "COZY / SIMULATION",
    minimum: {
      cpu: "2 GHz processor",
      gpu: "256 MB video memory, Shader Model 3.0+",
      ramGb: 2,
      vramGb: 0.25,
      storageGb: 0.5,
    },
    osLabel: "Windows Vista or newer; separate macOS/Linux requirements exist",
    sourceLabel: "Steam Support — Stardew Valley",
    sourceUrl: "https://help.steampowered.com/en/wizard/HelpWithGameTechnicalIssue/?appid=413150",
    checkedAt: "2026-10-30",
    caveat: "Nhà phát hành không công bố cấu hình khuyến nghị trong trang yêu cầu hệ thống được tham chiếu.",
  },
  {
    slug: "fortnite",
    title: "Fortnite",
    category: "BATTLE ROYALE / COMPETITIVE",
    minimum: {
      cpu: "Intel Core i3-3225 3.3 GHz",
      gpu: "Intel HD 4000 / AMD Radeon Vega 8",
      ramGb: 8,
    },
    recommended: {
      cpu: "Intel Core i5-7300U 3.5 GHz / AMD Ryzen 3 3300U",
      gpu: "NVIDIA GeForce GTX 960 / AMD Radeon R9 280 (DirectX 11)",
      ramGb: 16,
      vramGb: 2,
      requiresSsd: true,
    },
    osLabel: "Windows 10 64-bit (minimum version 22H2); Windows 10/11 64-bit recommended",
    sourceLabel: "Epic Games Support — Fortnite PC System Requirements",
    sourceUrl: "https://www.epicgames.com/help/c-34254770/c-5719357839387/a16548002",
    checkedAt: "2026-10-30",
    officialPerformanceNote: "Epic công bố riêng preset Epic Quality với yêu cầu phần cứng cao hơn; mục này chỉ dùng tier Recommended tiêu chuẩn.",
    caveat: "Nguồn không công bố dung lượng lưu trữ. VRAM 2 GB là mức Recommended tiêu chuẩn, không phải preset Epic Quality.",
  },
  {
    slug: "black-myth-wukong",
    title: "Black Myth: Wukong",
    category: "ACTION RPG / AAA",
    minimum: {
      cpu: "Intel Core i5-8400 / AMD Ryzen 5 1600",
      gpu: "NVIDIA GeForce GTX 1060 6 GB / AMD Radeon RX 580 8 GB",
      ramGb: 16,
      storageGb: 130,
    },
    recommended: {
      cpu: "Intel Core i7-9700 / AMD Ryzen 5 5500",
      gpu: "NVIDIA GeForce RTX 2060 / AMD Radeon RX 5700 XT / Intel Arc A750",
      ramGb: 16,
      storageGb: 130,
      requiresSsd: true,
    },
    osLabel: "Windows 10 64-bit",
    sourceLabel: "Steam Store — Black Myth: Wukong System Requirements",
    sourceUrl: "https://store.steampowered.com/app/2358720/Black_Myth_Wukong/",
    checkedAt: "2026-10-30",
    officialPerformanceNote: "Nhà phát hành ghi chú cấu hình được kiểm thử với DLSS/FSR/XeSS bật; mức tối thiểu hỗ trợ HDD, còn tier Recommended yêu cầu SSD.",
    caveat: "VRAM khác nhau theo lựa chọn GPU NVIDIA/AMD/Intel nên không quy đổi thành một ngưỡng VRAM duy nhất.",
  },
  {
    slug: "monster-hunter-wilds",
    title: "Monster Hunter Wilds",
    category: "ACTION RPG / HUNTING",
    minimum: {
      cpu: "Intel Core i5-10400 / i3-12100 / AMD Ryzen 5 3600",
      gpu: "NVIDIA GeForce GTX 1660 6 GB / AMD Radeon RX 5500 XT 8 GB",
      ramGb: 16,
      storageGb: 75,
      requiresSsd: true,
    },
    recommended: {
      cpu: "Intel Core i5-10400 / i3-12100 / AMD Ryzen 5 3600",
      gpu: "NVIDIA GeForce RTX 2060 SUPER 8 GB / AMD Radeon RX 6600 8 GB",
      ramGb: 16,
      vramGb: 8,
      storageGb: 75,
      requiresSsd: true,
    },
    osLabel: "Windows 10/11 64-bit",
    sourceLabel: "Steam Support — Monster Hunter Wilds System Requirements",
    sourceUrl: "https://store.steampowered.com/app/2246340/Monster_Hunter_Wilds/",
    checkedAt: "2026-10-30",
    officialPerformanceNote: "Nguồn ghi mức tối thiểu là 1080p (upscale từ 720p native) / 30 FPS ở Lowest; Recommended là 1080p / 60 FPS ở Medium khi bật Frame Generation.",
    caveat: "Mốc 60 FPS khuyến nghị phụ thuộc Frame Generation; không được hiểu là FPS bảo đảm khi tắt tính năng này.",
  },
];

export type PCBenchmarkKind = "cpu" | "gpu";

export type PCBenchmarkReference = {
  id: string;
  kind: PCBenchmarkKind;
  model: string;
  metricLabel: "CPU Mark" | "G3D Mark";
  score: number;
  sampleCount?: number;
  dataAsOf: string;
  checkedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  caveat: string;
};

/**
 * Curated reference scores from PassMark PerformanceTest comparisons.
 * They are cross-workload aggregate scores, not gaming FPS or a prediction
 * for a particular game, resolution, driver, power limit, or system build.
 */
export const pcBenchmarkReferences: PCBenchmarkReference[] = [
  {
    id: "cpu-i7-8700k",
    kind: "cpu",
    model: "Intel Core i7-8700K",
    metricLabel: "CPU Mark",
    score: 13554,
    sampleCount: 19446,
    dataAsOf: "2026-10-27",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark CPU Benchmarks",
    sourceUrl: "https://www.cpubenchmark.net/compare/3098vs4681vs4811/Intel-i7-8700K-vs-Intel-i5-12400F-vs-AMD-Ryzen-5-5600",
    caveat: "Điểm tổng hợp đa tác vụ; không phải FPS trong game.",
  },
  {
    id: "cpu-i5-12400f",
    kind: "cpu",
    model: "Intel Core i5-12400F",
    metricLabel: "CPU Mark",
    score: 19527,
    sampleCount: 18229,
    dataAsOf: "2026-10-27",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark CPU Benchmarks",
    sourceUrl: "https://www.cpubenchmark.net/compare/3098vs4681vs4811/Intel-i7-8700K-vs-Intel-i5-12400F-vs-AMD-Ryzen-5-5600",
    caveat: "Điểm tổng hợp đa tác vụ; hiệu năng game còn phụ thuộc GPU và engine.",
  },
  {
    id: "cpu-ryzen-5-5600",
    kind: "cpu",
    model: "AMD Ryzen 5 5600",
    metricLabel: "CPU Mark",
    score: 21488,
    sampleCount: 16319,
    dataAsOf: "2026-10-27",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark CPU Benchmarks",
    sourceUrl: "https://www.cpubenchmark.net/compare/3098vs4681vs4811/Intel-i7-8700K-vs-Intel-i5-12400F-vs-AMD-Ryzen-5-5600",
    caveat: "Điểm tổng hợp đa tác vụ; không quy đổi tuyến tính thành FPS.",
  },
  {
    id: "cpu-ryzen-7-5700x",
    kind: "cpu",
    model: "AMD Ryzen 7 5700X",
    metricLabel: "CPU Mark",
    score: 26540,
    dataAsOf: "2026-10-29",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark CPU Benchmarks",
    sourceUrl: "https://www.cpubenchmark.net/compare/3098vs4677vs4811vs3859vs4814/Intel-i7-8700K-vs-Intel-i5-12400-vs-AMD-Ryzen-5-5600-vs-AMD-Ryzen-5-5600X-vs-AMD-Ryzen-7-5700X",
    caveat: "Số mẫu riêng không được lưu trong bản tham chiếu này; kiểm tra nguồn để xem dữ liệu mới nhất.",
  },
  {
    id: "gpu-rtx-2060",
    kind: "gpu",
    model: "NVIDIA GeForce RTX 2060",
    metricLabel: "G3D Mark",
    score: 14071,
    sampleCount: 34895,
    dataAsOf: "2026-10-29",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark Video Card Benchmarks",
    sourceUrl: "https://www.videocardbenchmark.net/compare/4037vs4117vs4465vs4444vs4345/GeForce-RTX-2060-vs-GeForce-RTX-2060-SUPER-vs-Radeon-RX-6600-vs-Radeon-RX-6600-XT-vs-GeForce-RTX-3060-12GB",
    caveat: "Điểm GPU tổng hợp; không phải FPS của một tựa game hay một preset cụ thể.",
  },
  {
    id: "gpu-rtx-2060-super",
    kind: "gpu",
    model: "NVIDIA GeForce RTX 2060 SUPER",
    metricLabel: "G3D Mark",
    score: 16456,
    sampleCount: 13120,
    dataAsOf: "2026-10-29",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark Video Card Benchmarks",
    sourceUrl: "https://www.videocardbenchmark.net/compare/4037vs4117vs4465vs4444vs4345/GeForce-RTX-2060-vs-GeForce-RTX-2060-SUPER-vs-Radeon-RX-6600-vs-Radeon-RX-6600-XT-vs-GeForce-RTX-3060-12GB",
    caveat: "Điểm GPU tổng hợp; không phản ánh ray tracing, upscaling hay frame generation riêng.",
  },
  {
    id: "gpu-rx-6600",
    kind: "gpu",
    model: "AMD Radeon RX 6600",
    metricLabel: "G3D Mark",
    score: 15033,
    sampleCount: 16032,
    dataAsOf: "2026-10-29",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark Video Card Benchmarks",
    sourceUrl: "https://www.videocardbenchmark.net/compare/4037vs4117vs4465vs4444vs4345/GeForce-RTX-2060-vs-GeForce-RTX-2060-SUPER-vs-Radeon-RX-6600-vs-Radeon-RX-6600-XT-vs-GeForce-RTX-3060-12GB",
    caveat: "Điểm GPU tổng hợp; hiệu năng thực tế khác nhau theo game, API và driver.",
  },
  {
    id: "gpu-rx-6600-xt",
    kind: "gpu",
    model: "AMD Radeon RX 6600 XT",
    metricLabel: "G3D Mark",
    score: 16446,
    sampleCount: 7211,
    dataAsOf: "2026-10-29",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark Video Card Benchmarks",
    sourceUrl: "https://www.videocardbenchmark.net/compare/4037vs4117vs4465vs4444vs4345/GeForce-RTX-2060-vs-GeForce-RTX-2060-SUPER-vs-Radeon-RX-6600-vs-Radeon-RX-6600-XT-vs-GeForce-RTX-3060-12GB",
    caveat: "Điểm GPU tổng hợp; không phải cam kết FPS hay đánh giá giá/hiệu năng tại Việt Nam.",
  },
  {
    id: "gpu-rtx-3060",
    kind: "gpu",
    model: "NVIDIA GeForce RTX 3060 12 GB",
    metricLabel: "G3D Mark",
    score: 16699,
    sampleCount: 48123,
    dataAsOf: "2026-10-29",
    checkedAt: "2026-10-30",
    sourceLabel: "PassMark Video Card Benchmarks",
    sourceUrl: "https://www.videocardbenchmark.net/compare/4037vs4117vs4465vs4444vs4345/GeForce-RTX-2060-vs-GeForce-RTX-2060-SUPER-vs-Radeon-RX-6600-vs-Radeon-RX-6600-XT-vs-GeForce-RTX-3060-12GB",
    caveat: "Điểm GPU tổng hợp; VRAM 12 GB không bảo đảm FPS cao hơn ở mọi game.",
  },
];

function validNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

export function normalizePCBuildProfile(value: unknown): PCBuildProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...defaultPCBuildProfile };
  const input = value as Partial<PCBuildProfile>;
  const allowedOS: PCOperatingSystem[] = ["windows10", "windows11", "linux", "macos", "unknown"];
  const allowedStorage: PCStorageType[] = ["ssd", "hdd", "unknown"];
  const allowedResolutions: PCBuildProfile["resolution"][] = ["1080p", "1440p", "2160p"];
  const allowedFPS: PCBuildProfile["targetFps"][] = [30, 60, 120, 144];
  return {
    cpuModel: typeof input.cpuModel === "string" ? input.cpuModel.slice(0, 120) : "",
    gpuModel: typeof input.gpuModel === "string" ? input.gpuModel.slice(0, 120) : "",
    ramGb: validNumber(input.ramGb, 1, 512),
    vramGb: validNumber(input.vramGb, 0.25, 256),
    freeStorageGb: validNumber(input.freeStorageGb, 0, 100000),
    storageType: allowedStorage.includes(input.storageType as PCStorageType) ? input.storageType as PCStorageType : "unknown",
    os: allowedOS.includes(input.os as PCOperatingSystem) ? input.os as PCOperatingSystem : "unknown",
    resolution: allowedResolutions.includes(input.resolution as PCBuildProfile["resolution"]) ? input.resolution as PCBuildProfile["resolution"] : "1080p",
    targetFps: allowedFPS.includes(input.targetFps as PCBuildProfile["targetFps"]) ? input.targetFps as PCBuildProfile["targetFps"] : 60,
  };
}

function metricStatus(actual: number | null, minimum: number | undefined, recommended: number | undefined): RequirementCheckStatus {
  if (minimum === undefined) return "not-published";
  if (actual === null) return "unknown";
  if (actual < minimum) return "below-minimum";
  if (recommended !== undefined && actual >= recommended) return "recommended";
  return "minimum";
}

function hardwareStatus(assessment: HardwareAssessment, hasRecommendedRequirement: boolean, model: string): RequirementCheckStatus {
  if (!model.trim() || assessment === "unknown") return "unknown";
  if (assessment === "below-minimum") return "below-minimum";
  if (assessment === "recommended" && !hasRecommendedRequirement) return "unknown";
  return assessment;
}

function formatGB(value: number | undefined): string {
  if (value === undefined) return "Không được công bố";
  return value < 1 ? `${value * 1000} MB` : `${value} GB`;
}

export function evaluatePCBuild(
  build: PCBuildProfile,
  game: PCGameRequirement,
  cpuAssessment: HardwareAssessment,
  gpuAssessment: HardwareAssessment,
): PCCompatibilityReport {
  const checks: RequirementCheck[] = [
    {
      id: "cpu",
      label: "CPU",
      actual: build.cpuModel.trim() || "Chưa nhập model",
      minimum: game.minimum.cpu,
      recommended: game.recommended?.cpu ?? "Không được công bố",
      status: hardwareStatus(cpuAssessment, Boolean(game.recommended?.cpu), build.cpuModel),
      detail: "Tên model không đủ để xác định hiệu năng; hãy đối chiếu model với yêu cầu chính thức rồi chọn trạng thái.",
      affectsPerformanceTier: true,
    },
    {
      id: "gpu",
      label: "GPU",
      actual: build.gpuModel.trim() || "Chưa nhập model",
      minimum: game.minimum.gpu,
      recommended: game.recommended?.gpu ?? "Không được công bố",
      status: hardwareStatus(gpuAssessment, Boolean(game.recommended?.gpu), build.gpuModel),
      detail: "Không tự suy đoán benchmark từ tên card. Trạng thái này dựa trên xác nhận của bạn.",
      affectsPerformanceTier: true,
    },
    {
      id: "ram",
      label: "RAM",
      actual: build.ramGb === null ? "Chưa nhập" : `${build.ramGb} GB`,
      minimum: formatGB(game.minimum.ramGb),
      recommended: formatGB(game.recommended?.ramGb),
      status: metricStatus(build.ramGb, game.minimum.ramGb, game.recommended?.ramGb),
      detail: "Đối chiếu dung lượng RAM đã nhập với yêu cầu hệ thống được công bố.",
      affectsPerformanceTier: true,
    },
    {
      id: "vram",
      label: "VRAM",
      actual: build.vramGb === null ? "Chưa nhập" : formatGB(build.vramGb),
      minimum: formatGB(game.minimum.vramGb),
      recommended: formatGB(game.recommended?.vramGb),
      status: metricStatus(build.vramGb, game.minimum.vramGb, game.recommended?.vramGb),
      detail: "Nếu nhà phát hành không nêu VRAM riêng, hệ thống không tự suy ra từ tên GPU.",
      affectsPerformanceTier: true,
    },
    {
      id: "storage",
      label: "Dung lượng trống",
      actual: build.freeStorageGb === null ? "Chưa nhập" : `${build.freeStorageGb} GB`,
      minimum: formatGB(game.minimum.storageGb),
      recommended: formatGB(game.recommended?.storageGb),
      status: metricStatus(build.freeStorageGb, game.minimum.storageGb, undefined),
      detail: "Dung lượng cài đặt cần có; nên chừa thêm dung lượng cho bản cập nhật và dữ liệu tạm.",
      affectsPerformanceTier: false,
    },
  ];

  if (game.minimum.requiresSsd) {
    checks.push({
      id: "ssd",
      label: "Ổ lưu trữ",
      actual: build.storageType === "unknown" ? "Chưa xác định" : build.storageType.toUpperCase(),
      minimum: "SSD",
      recommended: game.recommended?.requiresSsd ? "SSD" : "Không được công bố",
      status: build.storageType === "ssd" ? "minimum" : build.storageType === "hdd" ? "below-minimum" : "unknown",
      detail: "Nguồn yêu cầu SSD; ổ HDD không được tính là đạt mức tối thiểu.",
      affectsPerformanceTier: false,
    });
  }

  const windowsSelected = build.os === "windows10" || build.os === "windows11";
  if (!windowsSelected && build.os !== "unknown") {
    checks.push({
      id: "os",
      label: "Hệ điều hành",
      actual: build.os === "linux" ? "Linux" : "macOS",
      minimum: game.osLabel,
      recommended: "Kiểm tra yêu cầu riêng của hệ điều hành",
      status: "unknown",
      detail: "Bộ dữ liệu này ưu tiên yêu cầu Windows; chưa thể kết luận tương thích trên hệ điều hành bạn chọn.",
      affectsPerformanceTier: false,
    });
  }

  const requiredChecks = checks.filter((check) => check.status !== "not-published");
  const issues = requiredChecks
    .filter((check) => check.status === "below-minimum")
    .map((check) => `${check.label}: thông số đã nhập thấp hơn yêu cầu tối thiểu hoặc chưa đáp ứng điều kiện bắt buộc.`);
  const unknowns = requiredChecks.filter((check) => check.status === "unknown");
  const performanceChecks = requiredChecks.filter((check) => check.affectsPerformanceTier);
  const recommendedAvailable = Boolean(game.recommended?.cpu && game.recommended?.gpu && game.recommended?.ramGb !== undefined);
  const hasFailures = requiredChecks.some((check) => check.status === "below-minimum");
  const hasUnknowns = unknowns.length > 0;
  const allPerformanceRecommended = recommendedAvailable && performanceChecks.length > 0
    && performanceChecks.every((check) => check.status === "recommended" || check.status === "not-published");

  let status: PCCompatibilityReport["status"];
  if (hasFailures) status = "below-minimum";
  else if (hasUnknowns) status = "needs-verification";
  else if (allPerformanceRecommended) status = "recommended";
  else status = "minimum-met";

  return { status, checks, issues, recommendedAvailable };
}
