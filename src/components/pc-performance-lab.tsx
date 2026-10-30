"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  defaultPCBuildProfile,
  evaluatePCBuild,
  normalizePCBuildProfile,
  PC_BUILD_GUEST_STORAGE_KEY,
  PC_BUILD_USER_STORAGE_PREFIX,
  pcGameRequirements,
  pcBenchmarkReferences,
  type HardwareAssessment,
  type PCBenchmarkKind,
  type PCBuildProfile,
  type PCGameRequirement,
  type PCGameTier,
  type RequirementCheckStatus,
} from "@/lib/pc-performance";

const statusLabels: Record<RequirementCheckStatus, string> = {
  unknown: "CHƯA XÁC MINH",
  "not-published": "KHÔNG CÓ DỮ LIỆU",
  "below-minimum": "CHƯA ĐẠT",
  minimum: "ĐẠT TỐI THIỂU",
  recommended: "ĐẠT KHUYẾN NGHỊ",
};

const reportLabels = {
  "below-minimum": {
    title: "Có tiêu chí chưa đạt tối thiểu",
    detail: "Ít nhất một thông số đã nhập thấp hơn yêu cầu hoặc chưa đáp ứng điều kiện bắt buộc.",
  },
  "needs-verification": {
    title: "Cần xác minh thêm",
    detail: "Chưa đủ dữ liệu để kết luận. Kiểm tra các dòng đang ở trạng thái chưa xác minh trước khi quyết định nâng cấp.",
  },
  "minimum-met": {
    title: "Đạt mức tối thiểu đã kiểm tra",
    detail: "Các tiêu chí bắt buộc đã được đối chiếu đều đạt mức tối thiểu. Điều này không bảo đảm FPS hay độ mượt trong mọi tình huống.",
  },
  recommended: {
    title: "Đạt mức khuyến nghị đã kiểm tra",
    detail: "Các tiêu chí hiệu năng có dữ liệu khuyến nghị đều được đánh dấu đạt. Đây vẫn không phải dự báo FPS thực tế.",
  },
} as const;

function numericValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatGB(value: number): string {
  if (value < 1) return `${value * 1000} MB`;
  return `${value} GB`;
}

function RequirementList({ tier, label }: { tier?: PCGameTier; label: string }) {
  if (!tier) {
    return (
      <div className="pc-requirement-card">
        <p className="pc-requirement-tier">{label}</p>
        <p className="pc-requirement-empty">Nguồn được dẫn không công bố đầy đủ cấu hình ở mức này.</p>
      </div>
    );
  }

  return (
    <div className="pc-requirement-card">
      <p className="pc-requirement-tier">{label}</p>
      <dl className="pc-requirement-list">
        <div><dt>CPU</dt><dd>{tier.cpu}</dd></div>
        <div><dt>GPU</dt><dd>{tier.gpu}</dd></div>
        <div><dt>RAM</dt><dd>{tier.ramGb} GB</dd></div>
        {tier.vramGb !== undefined ? <div><dt>VRAM</dt><dd>{formatGB(tier.vramGb)}</dd></div> : null}
        <div><dt>Lưu trữ</dt><dd>{tier.storageGb === undefined ? "Không được công bố" : tier.storageGb < 1 ? formatGB(tier.storageGb) : `${tier.storageGb} GB`}{tier.requiresSsd ? " · SSD bắt buộc" : ""}</dd></div>
      </dl>
    </div>
  );
}

function hardwareOptions(game: PCGameRequirement) {
  return [
    { value: "unknown", label: "Chưa xác minh model" },
    { value: "below-minimum", label: "Dưới yêu cầu tối thiểu" },
    { value: "minimum", label: "Đã đối chiếu: đạt tối thiểu" },
    ...(game.recommended ? [{ value: "recommended", label: "Đã đối chiếu: đạt khuyến nghị" }] : []),
  ];
}

export function PCPerformanceLab() {
  const [build, setBuild] = useState<PCBuildProfile>({ ...defaultPCBuildProfile });
  const [selectedSlug, setSelectedSlug] = useState(pcGameRequirements[0].slug);
  const [cpuAssessment, setCpuAssessment] = useState<HardwareAssessment>("unknown");
  const [gpuAssessment, setGpuAssessment] = useState<HardwareAssessment>("unknown");
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "error">("loading");
  const [benchmarkKind, setBenchmarkKind] = useState<PCBenchmarkKind>("gpu");

  const selectedGame = useMemo(
    () => pcGameRequirements.find((game) => game.slug === selectedSlug) ?? pcGameRequirements[0],
    [selectedSlug],
  );
  const report = useMemo(
    () => evaluatePCBuild(build, selectedGame, cpuAssessment, gpuAssessment),
    [build, selectedGame, cpuAssessment, gpuAssessment],
  );
  const activeStorageKey = userId ? PC_BUILD_USER_STORAGE_PREFIX + userId : PC_BUILD_GUEST_STORAGE_KEY;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    }).catch(() => setAuthReady(true));

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setHydrated(false);
    setStorageKey(null);
    setSaveState("loading");

    let nextBuild: PCBuildProfile = { ...defaultPCBuildProfile };
    try {
      const raw = window.localStorage.getItem(activeStorageKey);
      if (raw) nextBuild = normalizePCBuildProfile(JSON.parse(raw));
    } catch {
      nextBuild = { ...defaultPCBuildProfile };
    }

    setBuild(nextBuild);
    setStorageKey(activeStorageKey);
    setHydrated(true);
  }, [activeStorageKey, authReady]);

  useEffect(() => {
    if (!hydrated || !storageKey || storageKey !== activeStorageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(build));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [activeStorageKey, build, hydrated, storageKey]);

  function updateBuild<K extends keyof PCBuildProfile>(key: K, value: PCBuildProfile[K]) {
    setBuild((current) => ({ ...current, [key]: value }));
  }

  function selectGame(slug: string) {
    setSelectedSlug(slug);
    setCpuAssessment("unknown");
    setGpuAssessment("unknown");
  }

  function loadExampleBuild() {
    setBuild({
      cpuModel: "AMD Ryzen 5 5600",
      gpuModel: "NVIDIA GeForce RTX 3060 12 GB",
      ramGb: 16,
      vramGb: 12,
      freeStorageGb: 180,
      storageType: "ssd",
      os: "windows11",
      resolution: "1440p",
      targetFps: 60,
    });
    setCpuAssessment("unknown");
    setGpuAssessment("unknown");
  }

  function clearBuild() {
    setBuild({ ...defaultPCBuildProfile });
    setCpuAssessment("unknown");
    setGpuAssessment("unknown");
  }

  const saveMessage = saveState === "loading"
    ? "Đang tải hồ sơ cấu hình…"
    : saveState === "error"
      ? "Không thể lưu vào bộ nhớ trình duyệt. Hãy kiểm tra quyền lưu trữ."
      : userId
        ? "Tự động lưu trên thiết bị này · tách riêng theo tài khoản"
        : "Tự động lưu trên thiết bị này · hồ sơ khách";

  return (
    <div className="pc-lab-workspace">
      <section className="pc-build-panel" aria-labelledby="pc-build-heading">
        <div className="pc-panel-topline">
          <span className="pc-panel-index">01 / BUILD PROFILE</span>
          <span className="pc-local-status"><i aria-hidden="true" /> {saveState === "saved" ? "LOCAL SAVE" : "PROFILE"}</span>
        </div>
        <div className="pc-panel-heading">
          <p className="eyebrow">YOUR HARDWARE</p>
          <h2 id="pc-build-heading">Khai báo <span>cấu hình.</span></h2>
          <p>Nhập thông số bạn biết. Để trống mục chưa rõ thay vì đoán giá trị.</p>
        </div>

        <div className="pc-build-grid">
          <label className="pc-field pc-field-wide">
            <span>CPU / PROCESSOR</span>
            <input
              value={build.cpuModel}
              maxLength={120}
              onChange={(event) => updateBuild("cpuModel", event.target.value)}
              placeholder="VD: Ryzen 5 5600 / Core i5-12400F"
              autoComplete="off"
            />
          </label>
          <label className="pc-field pc-field-wide">
            <span>GPU / GRAPHICS CARD</span>
            <input
              value={build.gpuModel}
              maxLength={120}
              onChange={(event) => updateBuild("gpuModel", event.target.value)}
              placeholder="VD: RTX 3060 12 GB / RX 6700 XT"
              autoComplete="off"
            />
          </label>
          <label className="pc-field">
            <span>RAM (GB)</span>
            <input
              type="number"
              min="1"
              max="512"
              step="1"
              value={build.ramGb ?? ""}
              onChange={(event) => updateBuild("ramGb", numericValue(event.target.value))}
              placeholder="VD: 16"
              inputMode="numeric"
            />
          </label>
          <label className="pc-field">
            <span>VRAM (GB)</span>
            <input
              type="number"
              min="0.25"
              max="256"
              step="0.25"
              value={build.vramGb ?? ""}
              onChange={(event) => updateBuild("vramGb", numericValue(event.target.value))}
              placeholder="VD: 8"
              inputMode="decimal"
            />
          </label>
          <label className="pc-field">
            <span>DUNG LƯỢNG TRỐNG (GB)</span>
            <input
              type="number"
              min="0"
              max="100000"
              step="1"
              value={build.freeStorageGb ?? ""}
              onChange={(event) => updateBuild("freeStorageGb", numericValue(event.target.value))}
              placeholder="VD: 120"
              inputMode="numeric"
            />
          </label>
          <label className="pc-field">
            <span>LOẠI Ổ LƯU TRỮ</span>
            <select value={build.storageType} onChange={(event) => updateBuild("storageType", event.target.value as PCBuildProfile["storageType"])}>
              <option value="unknown">Chưa rõ</option>
              <option value="ssd">SSD</option>
              <option value="hdd">HDD</option>
            </select>
          </label>
          <label className="pc-field">
            <span>HỆ ĐIỀU HÀNH</span>
            <select value={build.os} onChange={(event) => updateBuild("os", event.target.value as PCBuildProfile["os"])}>
              <option value="windows11">Windows 11</option>
              <option value="windows10">Windows 10</option>
              <option value="linux">Linux / SteamOS</option>
              <option value="macos">macOS</option>
              <option value="unknown">Chưa rõ</option>
            </select>
          </label>
          <label className="pc-field">
            <span>ĐỘ PHÂN GIẢI MỤC TIÊU</span>
            <select value={build.resolution} onChange={(event) => updateBuild("resolution", event.target.value as PCBuildProfile["resolution"])}>
              <option value="1080p">1080p · Full HD</option>
              <option value="1440p">1440p · QHD</option>
              <option value="2160p">2160p · 4K</option>
            </select>
          </label>
          <label className="pc-field">
            <span>MỤC TIÊU FPS</span>
            <select value={build.targetFps} onChange={(event) => updateBuild("targetFps", Number(event.target.value) as PCBuildProfile["targetFps"])}>
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
              <option value={120}>120 FPS</option>
              <option value={144}>144 FPS</option>
            </select>
          </label>
        </div>

        <div className="pc-build-actions">
          <button type="button" className="btn btn-secondary" onClick={loadExampleBuild}>Điền cấu hình minh họa</button>
          <button type="button" className="pc-reset-button" onClick={clearBuild}>Xóa cấu hình</button>
        </div>
        <p className="pc-save-note" role="status" aria-live="polite">{saveMessage}</p>
        <p className="pc-privacy-note">Hồ sơ chỉ lưu trong bộ nhớ trình duyệt, tách khóa khách và tài khoản đăng nhập. Chưa đồng bộ lên cloud hoặc thiết bị khác.</p>
      </section>

      <section className="pc-analysis-panel" aria-labelledby="pc-analysis-heading">
        <div className="pc-panel-topline">
          <span className="pc-panel-index">02 / COMPATIBILITY SCAN</span>
          <span className="pc-panel-code">LVLUP_SYS_CHECK</span>
        </div>
        <div className="pc-panel-heading">
          <p className="eyebrow">GAME REQUIREMENTS</p>
          <h2 id="pc-analysis-heading">Đối chiếu <span>phần cứng.</span></h2>
          <p>Chọn game có dữ liệu yêu cầu hệ thống đã được dẫn nguồn.</p>
        </div>

        <label className="pc-field pc-game-picker">
          <span>CHỌN GAME ĐỂ PHÂN TÍCH</span>
          <select value={selectedSlug} onChange={(event) => selectGame(event.target.value)}>
            {pcGameRequirements.map((game) => <option key={game.slug} value={game.slug}>{game.title} · {game.category}</option>)}
          </select>
        </label>

        <div className={`pc-verdict is-${report.status}`} aria-live="polite">
          <span className="pc-verdict-kicker">SCAN RESULT / {selectedGame.slug.toUpperCase()}</span>
          <h3>{reportLabels[report.status].title}</h3>
          <p>{reportLabels[report.status].detail}</p>
          <div className="pc-verdict-meta">
            <span>ĐỘ PHÂN GIẢI MỤC TIÊU <b>{build.resolution.toUpperCase()}</b></span>
            <span>MỤC TIÊU FPS <b>{build.targetFps} · CHƯA DỰ BÁO</b></span>
          </div>
        </div>

        <div className="pc-requirements-grid">
          <RequirementList tier={selectedGame.minimum} label="TIER 01 / TỐI THIỂU" />
          <RequirementList tier={selectedGame.recommended} label="TIER 02 / KHUYẾN NGHỊ" />
        </div>
        <p className="pc-os-note"><span>OS / PLATFORM NOTE</span>{selectedGame.osLabel}</p>

        <div className="pc-manual-check-panel">
          <div>
            <p className="eyebrow">MANUAL CPU / GPU VERIFICATION</p>
            <h3>Xác minh model thực tế</h3>
            <p>Không có benchmark đáng tin cậy cho mọi model CPU/GPU trong hệ thống. Hãy so sánh model đã nhập với yêu cầu bên trên và tự xác nhận; LevelUP không suy đoán từ tên linh kiện.</p>
          </div>
          <div className="pc-manual-check-grid">
            <label className="pc-field">
              <span>CPU SO VỚI YÊU CẦU</span>
              <select value={cpuAssessment} onChange={(event) => setCpuAssessment(event.target.value as HardwareAssessment)}>
                {hardwareOptions(selectedGame).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="pc-field">
              <span>GPU SO VỚI YÊU CẦU</span>
              <select value={gpuAssessment} onChange={(event) => setGpuAssessment(event.target.value as HardwareAssessment)}>
                {hardwareOptions(selectedGame).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="pc-check-results">
          <div className="pc-check-results-heading">
            <div>
              <p className="eyebrow">TELEMETRY / CHECKLIST</p>
              <h3>Chi tiết đối chiếu</h3>
            </div>
            <span>{report.checks.length.toString().padStart(2, "0")} CHECKS</span>
          </div>
          <div className="pc-check-list">
            {report.checks.map((check) => (
              <article className={`pc-check-row is-${check.status}`} key={check.id}>
                <div className="pc-check-title">
                  <h4>{check.label}</h4>
                  <span>{statusLabels[check.status]}</span>
                </div>
                <p className="pc-check-actual">{check.actual}</p>
                <dl>
                  <div><dt>TỐI THIỂU</dt><dd>{check.minimum}</dd></div>
                  <div><dt>KHUYẾN NGHỊ</dt><dd>{check.recommended}</dd></div>
                </dl>
                <p className="pc-check-detail">{check.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="pc-advisor-note">
          <p className="eyebrow">PERFORMANCE ADVISOR / NO FAKE FPS</p>
          <h3>Đối chiếu yêu cầu không đồng nghĩa với cam kết hiệu năng.</h3>
          <p>{selectedGame.officialPerformanceNote ?? "Nguồn được dẫn không cung cấp một dự báo FPS đáng tin cậy cho cấu hình bạn nhập. LevelUP không tự tạo con số FPS."}</p>
          {selectedGame.caveat ? <p>{selectedGame.caveat}</p> : null}
          {report.issues.length > 0 ? (
            <ul>{report.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
          ) : null}
          <div className="pc-source-footer">
            <span>NGUỒN YÊU CẦU · KIỂM TRA {selectedGame.checkedAt}</span>
            <a href={selectedGame.sourceUrl} target="_blank" rel="noreferrer">{selectedGame.sourceLabel} ↗</a>
          </div>
        </div>
      </section>

      <section className="pc-benchmark-panel" aria-labelledby="pc-benchmark-heading">
        <div className="pc-benchmark-panel-head">
          <div>
            <p className="eyebrow">BENCHMARK INDEX / SOURCE-LOCKED</p>
            <h2 id="pc-benchmark-heading">Điểm tham chiếu <span>có nguồn.</span></h2>
            <p>Chỉ số tổng hợp để tham khảo tương quan phần cứng. Không chuyển điểm benchmark thành FPS và không tự động kết luận CPU/GPU của bạn đạt yêu cầu game.</p>
          </div>
          <div className="pc-benchmark-toggle" role="group" aria-label="Loại benchmark cần xem">
            <button type="button" aria-pressed={benchmarkKind === "gpu"} onClick={() => setBenchmarkKind("gpu")}>GPU / G3D MARK</button>
            <button type="button" aria-pressed={benchmarkKind === "cpu"} onClick={() => setBenchmarkKind("cpu")}>CPU / CPU MARK</button>
          </div>
        </div>
        <div className="pc-benchmark-list" aria-live="polite">
          {pcBenchmarkReferences.filter((item) => item.kind === benchmarkKind).map((item, index) => (
            <article className="pc-benchmark-card" key={item.id}>
              <div className="pc-benchmark-card-main">
                <span className="pc-benchmark-card-index">{String(index + 1).padStart(2, "0")} / {item.kind.toUpperCase()}</span>
                <h3>{item.model}</h3>
                <p>{item.sampleCount ? `Mẫu benchmark: ${item.sampleCount.toLocaleString("en-US")}` : "Nguồn không lưu số mẫu trong snapshot"} · dữ liệu nguồn {item.dataAsOf}</p>
              </div>
              <div className="pc-benchmark-card-score">
                <strong>{item.score.toLocaleString("en-US")}</strong>
                <span>{item.metricLabel}</span>
              </div>
              <p className="pc-benchmark-card-caveat">{item.caveat}</p>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceLabel} ↗</a>
            </article>
          ))}
        </div>
        <p className="pc-benchmark-footnote">Đã kiểm tra nguồn ngày 30/10/2026. PassMark cập nhật điểm theo mẫu gửi lên; điểm có thể thay đổi. So sánh CPU Mark với CPU Mark, G3D Mark với G3D Mark — không so chéo hai loại điểm.</p>
      </section>
    </div>
  );
}
