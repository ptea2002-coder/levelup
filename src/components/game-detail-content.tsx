import type { Game } from "@/lib/games";
import { getGameArtworkSources } from "@/lib/game-art";
import { getGameEditorial, getPcRequirements, getOfficialVideo, getSteamScreenshotUrl } from "@/lib/game-detail-content";

type GameDetailContentProps = {
  game: Game;
};

export function GameDetailContent({ game }: GameDetailContentProps) {
  const editorial = getGameEditorial(game.slug, game.category);
  const requirements = getPcRequirements(game.slug);
  const video = getOfficialVideo(game.slug);
  const screenshotUrl = getSteamScreenshotUrl(game.slug);
  const gallery = Array.from(new Set([
    ...(game.backgroundUrl ? [game.backgroundUrl] : []),
    ...(game.coverUrl ? [game.coverUrl] : []),
    ...getGameArtworkSources(game.slug, "card"),
    ...getGameArtworkSources(game.slug, "detail"),
  ])).slice(0, 4);

  return (
    <section className="section detail-content-section" id="game-guide">
      <div className="container">
        <div className="section-head detail-content-heading">
          <div>
            <p className="eyebrow">LEVELUP FIELD GUIDE / 003</p>
            <h2>HIỂU GAME.<br /><span>CHƠI CÓ CHIẾN LƯỢC.</span></h2>
          </div>
          <p className="section-aside">
            Từ cơ chế cốt lõi đến những bước đầu tiên — các ghi chú ngắn để bạn vào game tự tin hơn.
          </p>
        </div>

        <div className="detail-editorial-grid">
          <article className="detail-info-panel detail-gameplay-panel">
            <p className="eyebrow">01 / GAMEPLAY DNA</p>
            <h3>Điều làm nên <span>{game.title}</span></h3>
            <p className="detail-panel-intro">{editorial.tagline}</p>
            <ul className="detail-highlight-list">
              {editorial.highlights.map((highlight, index) => (
                <li key={highlight}>
                  <span className="detail-list-index">{String(index + 1).padStart(2, "0")}</span>
                  <p>{highlight}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="detail-info-panel detail-guide-panel">
            <p className="eyebrow">02 / FIRST RUN</p>
            <h3>Hướng dẫn <span>người mới</span></h3>
            <ol className="detail-guide-list">
              {editorial.beginnerGuide.map((step, index) => (
                <li key={step.title}>
                  <span className="detail-guide-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <div className="detail-media-grid">
          <article className="detail-info-panel detail-gallery-panel">
            <div className="detail-panel-heading">
              <div>
                <p className="eyebrow">03 / VISUAL ARCHIVE</p>
                <h3>Artwork <span>& media</span></h3>
              </div>
              <span className="detail-count">{String(gallery.length).padStart(2, "0")} VISUALS</span>
            </div>
            {gallery.length > 0 ? (
              <div className="detail-gallery-grid">
                {gallery.map((src, index) => (
                  <figure className={"detail-gallery-item detail-gallery-item-" + index} key={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={game.title + " promotional artwork " + (index + 1)} loading="lazy" decoding="async" />
                    <figcaption><span>0{index + 1}</span>{index === 0 ? "Key art" : index === 1 ? "Library artwork" : "Game artwork"}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="detail-gallery-empty">Artwork đang được bổ sung.</div>
            )}
            <p className="detail-media-caption">
              Đây là artwork quảng bá. Ảnh chụp màn chơi được mở từ thư viện cộng đồng hoặc trang media của nhà phát hành.
            </p>
            <a className="detail-outline-link" href={screenshotUrl ?? game.officialUrl} target="_blank" rel="noopener noreferrer">
              {screenshotUrl ? "Xem ảnh chụp màn chơi trên Steam" : "Mở media chính thức"}
              <span aria-hidden="true">↗</span>
            </a>
          </article>

          <article className="detail-info-panel detail-video-panel">
            <div className="detail-panel-heading">
              <div>
                <p className="eyebrow">04 / WATCH THE GAME</p>
                <h3>Trailer <span>chính thức</span></h3>
              </div>
              <span className="detail-count">{video ? "VERIFIED" : "LINK OUT"}</span>
            </div>
            {video ? (
              <>
                <div className="detail-video-frame">
                  <iframe
                    src={"https://www.youtube-nocookie.com/embed/" + video.id + "?rel=0"}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <p className="detail-video-title">{video.title}</p>
                <p className="detail-media-caption">Nguồn video: {video.source}. Video được nhúng từ YouTube, không lưu trên máy chủ LevelUP.</p>
                <a className="detail-outline-link" href={"https://www.youtube.com/watch?v=" + video.id} target="_blank" rel="noopener noreferrer">
                  Xem trên YouTube <span aria-hidden="true">↗</span>
                </a>
              </>
            ) : (
              <div className="detail-video-empty">
                <span className="detail-video-play" aria-hidden="true">▶</span>
                <p>Trailer sẽ được thêm khi xác minh được nguồn chính thức phù hợp.</p>
                <a className="detail-outline-link" href={game.officialUrl} target="_blank" rel="noopener noreferrer">
                  Xem tin tức từ nhà phát hành <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </article>
        </div>

        <section className="detail-info-panel detail-specs-panel">
          <div className="detail-panel-heading detail-specs-heading">
            <div>
              <p className="eyebrow">05 / PC CHECK</p>
              <h3>Cấu hình <span>PC</span></h3>
            </div>
            <span className={"detail-spec-status" + (requirements ? " is-verified" : "")}>
              {requirements ? "ĐÃ CÓ NGUỒN" : "CẦN KIỂM TRA"}
            </span>
          </div>
          {requirements ? (
            <div className="detail-spec-grid">
              <div className="detail-spec-column">
                <h4><span aria-hidden="true">01</span> Tối thiểu</h4>
                <ul>{requirements.minimum.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="detail-spec-column">
                <h4><span aria-hidden="true">02</span> Khuyến nghị</h4>
                {requirements.recommended ? (
                  <ul>{requirements.recommended.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p className="detail-spec-unavailable">Nguồn chính thức hiện không nêu cấu hình khuyến nghị riêng. Không nên suy ra cấu hình từ mức tối thiểu.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="detail-spec-empty">
              <div>
                <h4>Chưa có bảng thông số được xác minh tại LevelUP</h4>
                <p>Để tránh gợi ý sai CPU/GPU, hãy kiểm tra yêu cầu hệ thống mới nhất từ nhà phát hành hoặc cửa hàng phân phối trước khi cài.</p>
              </div>
            </div>
          )}
          {requirements?.note ? <p className="detail-spec-note">{requirements.note}</p> : null}
          <div className="detail-spec-footer">
            <p>Yêu cầu có thể thay đổi theo bản cập nhật, hệ điều hành và thiết lập đồ họa.</p>
            <a className="detail-outline-link" href={requirements?.sourceUrl ?? game.officialUrl} target="_blank" rel="noopener noreferrer">
              {requirements?.sourceLabel ?? "Kiểm tra trang chính thức"}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
