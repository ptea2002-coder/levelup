export type GuideStep = {
  title: string;
  detail: string;
};

export type PcRequirements = {
  minimum: string[];
  recommended?: string[];
  sourceUrl: string;
  sourceLabel: string;
  note?: string;
};

export type GameEditorial = {
  tagline: string;
  highlights: string[];
  beginnerGuide: GuideStep[];
  video?: {
    id: string;
    title: string;
    source: string;
  };
  pcRequirements?: PcRequirements;
};

const editorial: Record<string, GameEditorial> = {
  valorant: {
    tagline: "Đấu súng chiến thuật 5v5, nơi thông tin và kỷ luật quan trọng ngang kỹ năng ngắm bắn.",
    highlights: ["Đặc vụ với bộ kỹ năng riêng", "Đặt/gỡ Spike và kiểm soát khu vực", "Đấu súng đòi hỏi độ chính xác cao"],
    beginnerGuide: [
      { title: "Giữ tâm ngắm ở tầm đầu", detail: "Đặt crosshair tại vị trí đối thủ có thể xuất hiện trước khi lia góc; hạn chế vừa chạy vừa bắn." },
      { title: "Làm quen 1–2 đặc vụ", detail: "Học kỹ năng và vai trò của một vài đặc vụ trước khi đổi liên tục, để tập trung cải thiện quyết định trong round." },
      { title: "Chia sẻ thông tin ngắn gọn", detail: "Báo vị trí, số lượng và hướng di chuyển của đối thủ. Dùng kỹ năng để hỗ trợ đồng đội, không chỉ để lấy mạng." },
    ],
    pcRequirements: {
      minimum: ["Windows 10 64-bit (Build 19041+) hoặc Windows 11", "CPU: Intel Core i3-540 hoặc AMD Athlon 200GE", "GPU: Intel HD 4000 hoặc AMD Radeon R5 220", "RAM: 4 GB; GPU rời cần tối thiểu 1 GB VRAM", "DirectX 11; CPU hỗ trợ SSE 4.2 hoặc AVX"],
      recommended: ["Mục tiêu 60 FPS: Intel Core i3-4150 hoặc AMD Ryzen 3 1200", "GPU: NVIDIA GeForce GT 730 hoặc AMD Radeon R7 240", "RAM: 4 GB; DirectX 11", "Windows 11 yêu cầu TPM 2.0 và UEFI Secure Boot"],
      sourceUrl: "https://valorant.vnggames.com/vi-vn/specs/",
      sourceLabel: "Trang cấu hình VALORANT Việt Nam",
      note: "Mức tối thiểu hướng tới 30 FPS; mức khuyến nghị hướng tới 60 FPS. Kiểm tra lại trang chính thức trước khi nâng cấp máy.",
    },
  },
  "league-of-legends": {
    tagline: "MOBA 5v5 thiên về kiểm soát đường, mục tiêu lớn và phối hợp đội hình.",
    highlights: ["Hệ thống tướng và vai trò đa dạng", "Trận đấu xoay quanh đường, trụ và mục tiêu lớn", "Kỹ năng đọc bản đồ quyết định giao tranh"],
    beginnerGuide: [
      { title: "Chọn một vị trí chính", detail: "Bắt đầu với một đường và vài vị tướng dễ hiểu để học nhiệm vụ của vai trò trước khi mở rộng bể tướng." },
      { title: "Ưu tiên lính và kinh nghiệm", detail: "Tập kết liễu lính ổn định; đừng đổi quá nhiều máu chỉ để đuổi theo một pha hạ gục không chắc chắn." },
      { title: "Nhìn bản đồ nhỏ thường xuyên", detail: "Theo dõi vị trí đối thủ và di chuyển cùng đội khi tranh chấp Rồng, Sứ Giả hoặc Baron." },
    ],
  },
  "counter-strike-2": {
    tagline: "FPS chiến thuật đặt trọng tâm vào góc bắn, kinh tế, utility và giao tiếp theo round.",
    highlights: ["Đấu đội Terrorist và Counter-Terrorist", "Khói động và utility mở ra nhiều cách kiểm soát bản đồ", "Quản lý tiền quan trọng như kỹ năng bắn"],
    beginnerGuide: [
      { title: "Tập đặt tâm ở góc đầu", detail: "Giữ crosshair gần vị trí đối thủ thường đứng và học từng góc trên một bản đồ thay vì chạy khắp nơi." },
      { title: "Hiểu khi nào nên mua", detail: "Mua cùng nhịp với đội; nếu kinh tế yếu, trao đổi với đồng đội để tránh mỗi người dùng một bộ trang bị khác nhau." },
      { title: "Dùng utility có mục đích", detail: "Học một vài smoke/flash cơ bản cho bản đồ bạn chơi nhiều và báo trước khi ném để tránh cản đồng đội." },
    ],
    pcRequirements: {
      minimum: ["Windows 10", "CPU: 4 luồng phần cứng; Intel Core i5-750 hoặc cao hơn", "RAM: 8 GB", "GPU: VRAM từ 1 GB, hỗ trợ DirectX 11 và Shader Model 5.0", "DirectX 11; 85 GB dung lượng trống"],
      sourceUrl: "https://store.steampowered.com/app/730/CounterStrike_2/",
      sourceLabel: "Yêu cầu hệ thống trên Steam",
      note: "Steam hiện liệt kê cấu hình tối thiểu cho Windows và Linux, không có bảng khuyến nghị riêng trên trang này. FPS thực tế phụ thuộc bản đồ và thiết lập.",
    },
  },
  "apex-legends": {
    tagline: "Battle royale tốc độ cao với di chuyển linh hoạt, kỹ năng Legend và giao tranh theo squad.",
    highlights: ["Legend với kỹ năng chủ động và bị động", "Di chuyển, trượt và chọn vị trí là lợi thế lớn", "Hệ thống hồi sinh tạo cơ hội quay lại trận"],
    beginnerGuide: [
      { title: "Chọn Legend phù hợp nhịp chơi", detail: "Bắt đầu với nhân vật có kỹ năng dễ hiểu và học rõ cách kỹ năng giúp cả đội thoát hiểm, trinh sát hoặc mở giao tranh." },
      { title: "Đừng loot quá lâu", detail: "Lấy bộ trang bị cơ bản rồi di chuyển vào vùng an toàn; đứng ngoài vòng bo thường khiến đội mất vị trí tốt." },
      { title: "Giao tranh cùng đồng đội", detail: "Ping mục tiêu, tập trung bắn cùng một đối thủ và rút lui khi đội hình bị tách hoặc mất lợi thế." },
    ],
  },
  "genshin-impact": {
    tagline: "Action RPG thế giới mở kết hợp khám phá, câu chuyện nhân vật và phản ứng nguyên tố.",
    highlights: ["Khám phá Teyvat và giải đố môi trường", "Xây đội hình theo nguyên tố và phản ứng", "Nhiệm vụ, boss và hoạt động theo phiên bản"],
    beginnerGuide: [
      { title: "Xây một đội có phối hợp", detail: "Thử kết hợp nguyên tố để tạo phản ứng thay vì chỉ chọn nhân vật có chỉ số cao; nâng một nhân vật gây sát thương chính trước." },
      { title: "Khám phá theo khu vực", detail: "Mở điểm dịch chuyển và Statue of The Seven để đi lại thuận tiện, đồng thời thu thập tài nguyên dọc đường." },
      { title: "Dùng tài nguyên có kế hoạch", detail: "Ưu tiên vũ khí, cấp nhân vật và thiên phú của đội đang dùng. Tránh nâng đồng loạt quá nhiều nhân vật ngay đầu game." },
    ],
    pcRequirements: {
      minimum: ["Windows 10 64-bit", "CPU: Intel Core i5 thế hệ 6 hoặc AMD Ryzen tương đương", "RAM: 8 GB", "GPU: NVIDIA GeForce GTX 1050 hoặc Intel Iris Xe tương đương", "DirectX 11; ít nhất 110 GB dung lượng trống"],
      recommended: ["Windows 10/11 64-bit", "CPU: Intel Core i7 thế hệ 7 hoặc AMD Ryzen 5000 series trở lên", "RAM: 16 GB", "GPU: NVIDIA GeForce GTX 1060 6 GB hoặc tốt hơn", "DirectX 11; ít nhất 110 GB dung lượng trống; nên cài SSD"],
      sourceUrl: "https://support.hoyoverse.com/hc/en-us/articles/52089402685593-What-are-the-system-requirements-to-play-Genshin-Impact",
      sourceLabel: "HoYoverse Help Center",
      note: "Dung lượng có thể tăng theo các bản cập nhật. Thông số được đối chiếu với bài hỗ trợ cập nhật ngày 11/11/2025.",
    },
  },
  "elden-ring": {
    tagline: "Action RPG thế giới mở thưởng cho sự kiên nhẫn, quan sát và khám phá ngoài đường chính.",
    highlights: ["Thế giới mở rộng lớn với nhiều bí mật", "Boss đòi hỏi đọc nhịp và thời điểm né", "Nhiều hướng build nhân vật và cách tiếp cận trận đấu"],
    beginnerGuide: [
      { title: "Rời đi khi trận đánh quá khó", detail: "Khám phá khu vực khác, nâng cấp vũ khí hoặc tăng cấp rồi quay lại; tiến trình không nhất thiết phải đi theo một đường thẳng." },
      { title: "Học nhịp tấn công của boss", detail: "Quan sát chuỗi đòn và thời điểm hồi phục trước khi phản công. Né có chủ đích thường tốt hơn giữ nút né liên tục." },
      { title: "Nâng cấp vũ khí đang dùng", detail: "Chọn loại vũ khí hợp lối chơi và nâng cấp nó đều đặn; thử Spirit Ashes hoặc chơi co-op khi cần hỗ trợ." },
    ],
    video: { id: "MUV5dqaumHE", title: "ELDEN RING — Official Gameplay Trailer", source: "Bandai Namco Entertainment America" },
  },
  "pubg-battlegrounds": {
    tagline: "Battle royale sinh tồn với nhịp đấu súng căng thẳng và lợi thế đến từ vị trí.",
    highlights: ["Loot và quản lý trang bị", "Vòng bo tạo nhịp di chuyển", "Âm thanh và địa hình ảnh hưởng quyết định"],
    beginnerGuide: [
      { title: "Hạ cánh ở nơi dễ loot", detail: "Chọn khu vực ít đông khi mới học để có thời gian tìm vũ khí, giáp và hồi phục trước giao tranh." },
      { title: "Di chuyển trước khi bị ép", detail: "Theo dõi vòng bo và chọn đường có vật che chắn; tránh chạy qua đồng trống khi có lựa chọn an toàn hơn." },
      { title: "Nghe và ping", detail: "Dùng tai nghe để xác định hướng tiếng súng, báo vị trí cho đội và chỉ giao tranh khi có đường rút." },
    ],
  },
  fortnite: {
    tagline: "Battle royale linh hoạt, nơi lựa chọn chế độ, di chuyển và tận dụng vật che chắn tạo khác biệt.",
    highlights: ["Nhiều chế độ và sự kiện thay đổi theo mùa", "Xây dựng hoặc Zero Build tùy phong cách", "Di chuyển, loot và kiểm soát vùng an toàn"],
    beginnerGuide: [
      { title: "Thử Zero Build nếu mới bắt đầu", detail: "Chế độ này giảm áp lực học xây dựng để bạn tập trung vào ngắm bắn, vị trí và dùng vật che chắn." },
      { title: "Loot nhanh rồi xoay vòng", detail: "Tìm vũ khí tầm gần và tầm xa, hồi phục cơ bản rồi di chuyển trước khi vùng bão thu hẹp." },
      { title: "Chơi quanh vật che chắn", detail: "Đừng chạy thẳng trên địa hình trống. Dùng địa hình, công trình và góc nhìn để giảm thời gian phơi người." },
    ],
  },
  "dota-2": {
    tagline: "MOBA có chiều sâu chiến thuật, draft, kinh tế và phối hợp mục tiêu xuyên suốt trận đấu.",
    highlights: ["Hero pool lớn với nhiều phong cách", "Last hit, deny và kiểm soát lane", "Ward và quyết định mục tiêu tạo lợi thế chiến thuật"],
    beginnerGuide: [
      { title: "Bắt đầu với một vai trò", detail: "Chọn một vài hero có bộ kỹ năng đơn giản và học nhiệm vụ của position trước khi thử những hero cần phối hợp cao." },
      { title: "Tập last hit và giữ lane", detail: "Tập trung vào lượng vàng ổn định và vị trí lính; đừng bỏ lane quá lâu để săn một pha giao tranh thiếu chắc chắn." },
      { title: "Mua đồ theo tình huống", detail: "Đọc đội hình đối thủ và hỏi đồng đội về item phòng thủ hoặc hỗ trợ thay vì chỉ lên cùng một bộ đồ mỗi trận." },
    ],
  },
  "overwatch-2": {
    tagline: "Hero shooter theo đội, nơi vai trò, thời điểm dùng ultimate và mục tiêu quan trọng hơn chỉ số hạ gục.",
    highlights: ["Anh hùng thuộc các vai trò khác nhau", "Giao tranh theo nhịp kỹ năng và ultimate", "Mục tiêu bản đồ quyết định thắng thua"],
    beginnerGuide: [
      { title: "Làm quen hai hero", detail: "Chọn hai nhân vật thuộc vai trò bạn thích để hiểu kỹ năng, thời gian hồi và cách họ đóng góp cho đội." },
      { title: "Chơi quanh mục tiêu", detail: "Đừng đuổi theo đối thủ quá xa khi mục tiêu đang cần bảo vệ; giữ vị trí cùng đồng đội để giao tranh có tổ chức." },
      { title: "Phối hợp ultimate", detail: "Báo khi sẵn sàng dùng ultimate và tránh dồn nhiều kỹ năng lớn vào cùng một tình huống đã gần kết thúc." },
    ],
  },
  "call-of-duty-warzone": {
    tagline: "Battle royale quân sự với loadout, giao tranh nhanh và lựa chọn thời điểm tái triển khai.",
    highlights: ["Tùy biến loadout theo cách chơi", "Đánh chiếm vị trí và di chuyển theo vòng bo", "Giao tiếp squad giúp tránh bị tách đội"],
    beginnerGuide: [
      { title: "Bắt đầu với loadout dễ kiểm soát", detail: "Chọn một vũ khí ổn định cho tầm trung và một phương án cận chiến; học độ giật trước khi đổi phụ kiện liên tục." },
      { title: "Ưu tiên giáp và vị trí", detail: "Nạp giáp sau giao tranh và dùng vật che chắn khi xoay vòng; không nên chạy theo tiếng súng nếu đội chưa sẵn sàng." },
      { title: "Tập trung cùng squad", detail: "Ping mục tiêu, chia sẻ tiền/trang bị theo tình huống và thống nhất khi nào nên đánh hoặc rút." },
    ],
  },
  minecraft: {
    tagline: "Sandbox sinh tồn và sáng tạo, nơi mục tiêu do người chơi tự đặt ra.",
    highlights: ["Chế tạo công cụ và xây dựng nơi trú ẩn", "Khám phá hang động, quần xã và chiều không gian", "Có thể chơi sáng tạo, sinh tồn hoặc cùng bạn bè"],
    beginnerGuide: [
      { title: "Chuẩn bị trước khi trời tối", detail: "Thu thập gỗ, chế tạo công cụ cơ bản, tìm thức ăn và làm nơi trú ẩn có ánh sáng trước đêm đầu tiên." },
      { title: "Ghi lại vị trí quan trọng", detail: "Lưu tọa độ nhà, cổng Nether và điểm có tài nguyên quý để tránh lạc khi khám phá xa." },
      { title: "Tăng hiệu năng nếu cần", detail: "Giảm render distance và dùng thiết lập đồ họa nhẹ trước khi cài shader hoặc mod nặng; sao lưu thế giới trước khi thêm mod." },
    ],
    pcRequirements: {
      minimum: ["Mục tiêu tham khảo: 1080p / 30 FPS với thiết lập Fast", "Hệ điều hành 64-bit; CPU 4 nhân", "RAM: 8 GB nếu dùng GPU rời hoặc 12 GB nếu dùng đồ họa tích hợp", "GPU hỗ trợ Vulkan 1.3; tối thiểu 2 GB VRAM"],
      recommended: ["Mục tiêu tham khảo: 1080p / 60 FPS với thiết lập Fancy", "RAM: 16 GB", "CPU hiện đại mạnh hơn; GPU hỗ trợ Vulkan 1.3 với 6 GB VRAM"],
      sourceUrl: "https://www.minecraft.net/en-us/article/minecraft-java-edition-system-requirements",
      sourceLabel: "Minecraft.net — Java Edition requirements",
      note: "Đây là mốc cập nhật cho Minecraft Java Edition được công bố ngày 21/07/2026. Shader, mod và world lớn có thể cần cấu hình cao hơn.",
    },
  },
  roblox: {
    tagline: "Nền tảng trải nghiệm do cộng đồng sáng tạo, từ mini-game đến nhập vai và mô phỏng.",
    highlights: ["Nhiều thể loại trong cùng một nền tảng", "Trải nghiệm và luật chơi tùy từng creator", "Chơi cùng bạn bè và khám phá nội dung cộng đồng"],
    beginnerGuide: [
      { title: "Chọn trải nghiệm có mô tả rõ", detail: "Đọc mô tả, chế độ chơi và đánh giá trước khi vào; chất lượng và điều khiển khác nhau giữa từng trải nghiệm." },
      { title: "Tìm hiểu điều khiển ngay đầu game", detail: "Mỗi trải nghiệm có thể có phím và mục tiêu riêng. Dành vài phút ở khu vực hướng dẫn nếu có." },
      { title: "Giữ an toàn tài khoản", detail: "Không chia sẻ mật khẩu hoặc thông tin cá nhân trong chat; kiểm tra cài đặt quyền riêng tư và mua hàng." },
    ],
  },
  "honkai-star-rail": {
    tagline: "RPG theo lượt trong chuyến du hành vũ trụ, tập trung vào đội hình, điểm yếu và thứ tự lượt.",
    highlights: ["Chiến đấu theo lượt có tính toán", "Break Effect và điểm yếu nguyên tố", "Câu chuyện theo chương và hoạt động theo phiên bản"],
    beginnerGuide: [
      { title: "Ghép đội theo vai trò", detail: "Đảm bảo đội có nguồn sát thương, hỗ trợ và hồi phục/bảo vệ phù hợp với nội dung đang chơi." },
      { title: "Đánh vào điểm yếu khi có lợi", detail: "Chọn nhân vật giúp phá Weakness của kẻ địch và theo dõi thứ tự lượt trước khi dùng kỹ năng tiêu hao điểm." },
      { title: "Đầu tư vào đội chính", detail: "Ưu tiên cấp nhân vật, Light Cone và Trace cho đội hình dùng thường xuyên; tránh nâng quá nhiều nhân vật cùng lúc." },
    ],
  },
  "zenless-zone-zero": {
    tagline: "Action RPG đô thị với combo nhịp nhanh, né chính xác và chuyển nhân vật liên tục.",
    highlights: ["Chuỗi tấn công và cơ chế stun", "Đổi nhân vật để nối combo", "Đội hình cần phối hợp thuộc tính và vai trò"],
    beginnerGuide: [
      { title: "Tập né đúng thời điểm", detail: "Quan sát tín hiệu tấn công để thực hiện Perfect Dodge và tạo cơ hội phản công an toàn." },
      { title: "Dùng Chain Attack có chủ đích", detail: "Làm choáng mục tiêu rồi nối đòn giữa các thành viên đội thay vì chỉ giữ một nhân vật trên sân." },
      { title: "Xây đội có synergy", detail: "Đọc điều kiện kích hoạt kỹ năng bổ trợ của Agent và Bangboo trước khi đầu tư tài nguyên nâng cấp." },
    ],
  },
  "black-myth-wukong": {
    tagline: "Action RPG thần thoại với các trận boss giàu nhịp điệu, phép thuật và biến hóa chiến đấu.",
    highlights: ["Đối đầu boss với bộ chiêu riêng", "Kỹ năng, phép và thế đánh tạo nhiều cách tiếp cận", "Khám phá đường phụ để tìm tài nguyên"],
    beginnerGuide: [
      { title: "Quan sát trước khi tấn công", detail: "Học tầm đánh và chuỗi đòn của đối thủ; chỉ phản công sau những nhịp kết thúc rõ ràng để tránh bị ngắt combo." },
      { title: "Thử nghiệm kỹ năng phù hợp", detail: "Dùng điểm kỹ năng cho lối chơi bạn thấy hiệu quả và điều chỉnh cách tiếp cận theo từng boss." },
      { title: "Khám phá ngoài đường chính", detail: "Kiểm tra nhánh rẽ, khu vực khuất và điểm nghỉ để tìm vật phẩm hoặc mở thêm lựa chọn chuẩn bị." },
    ],
    video: { id: "bzyMLoSwYvk", title: "Black Myth: Wukong — Final Trailer", source: "Black Myth / Game Science" },
  },
  "stardew-valley": {
    tagline: "Mô phỏng nông trại thư giãn, nơi lịch mùa vụ và nhịp sống quyết định kế hoạch mỗi ngày.",
    highlights: ["Trồng trọt, câu cá và khai mỏ", "Xây dựng quan hệ với cư dân", "Nhiều mục tiêu dài hạn và lối chơi co-op"],
    beginnerGuide: [
      { title: "Trồng theo mùa", detail: "Kiểm tra mùa và số ngày cây cần lớn trước khi mua hạt giống để tránh cây héo khi đổi mùa." },
      { title: "Quản lý năng lượng", detail: "Mang thức ăn khi đi mỏ và dành công việc tiêu hao thể lực cho đầu ngày; không cần hoàn thành mọi việc trong một ngày." },
      { title: "Đặt mục tiêu nhỏ", detail: "Chọn một mục tiêu như nâng công cụ, sửa một khu vực nông trại hoặc hoàn thành vài gói Community Center." },
    ],
  },
  "ea-sports-fc-26": {
    tagline: "Bóng đá mô phỏng kết hợp xây dựng đội hình, chiến thuật và đọc tình huống trên sân.",
    highlights: ["Nhiều chế độ thi đấu đơn và online", "Chiến thuật đội hình ảnh hưởng cách triển khai", "Kỹ năng phòng ngự và chuyền bóng tạo nền tảng"],
    beginnerGuide: [
      { title: "Giữ cấu trúc đội hình", detail: "Chọn sơ đồ quen thuộc và học cách thoát pressing bằng chuyền ngắn trước khi thử các pha xử lý phức tạp." },
      { title: "Phòng ngự kiên nhẫn", detail: "Giữ vị trí và che đường chuyền; lao vào tắc bóng chỉ khi có cơ hội rõ ràng để tránh mở khoảng trống." },
      { title: "Tập các kỹ năng cốt lõi", detail: "Luyện chuyền, đổi hướng, dứt điểm và chuyển cầu thủ trong chế độ tập trước khi chơi các trận xếp hạng." },
    ],
  },
  "the-witcher-3": {
    tagline: "RPG thế giới mở giàu cốt truyện, nhiệm vụ phụ và lựa chọn có hệ quả.",
    highlights: ["Điều tra dấu vết và săn quái", "Nhiệm vụ nhiều nhánh và lựa chọn", "Chuẩn bị dầu, thuốc và dấu ấn trước trận khó"],
    beginnerGuide: [
      { title: "Đọc Bestiary trước khi săn", detail: "Kiểm tra loại quái và chuẩn bị dầu, bom hoặc dấu ấn phù hợp thay vì lao vào bằng một chiến thuật duy nhất." },
      { title: "Dùng Witcher Senses", detail: "Theo dấu vết và kiểm tra môi trường để tìm manh mối; nhiệm vụ phụ thường kể câu chuyện đáng giá." },
      { title: "Lưu trước quyết định lớn", detail: "Một số lựa chọn có thể ảnh hưởng kết quả nhiệm vụ. Tạo save thủ công khi chuẩn bị bước vào nhánh quan trọng." },
    ],
  },
  "final-fantasy-xiv": {
    tagline: "MMORPG thiên về cốt truyện, dungeon, raid và tiến trình nghề nghiệp dài hạn.",
    highlights: ["Main Scenario Quest dẫn dắt phần lớn nội dung", "Job và vai trò tank/healer/DPS rõ ràng", "Dungeon và raid khuyến khích phối hợp nhóm"],
    beginnerGuide: [
      { title: "Theo Main Scenario Quest", detail: "MSQ mở khu vực và nhiều tính năng quan trọng; biểu tượng nhiệm vụ chính thường là cách tốt để biết nên làm gì tiếp theo." },
      { title: "Học nhiệm vụ của role", detail: "Tank giữ quái, healer theo dõi máu, DPS xử lý sát thương và cơ chế. Đọc tooltip kỹ năng khi mở cấp mới." },
      { title: "Dùng Duty Finder", detail: "Đây là cách tìm nhóm cho dungeon và trial. Báo trước nếu mới học cơ chế và quan sát telegraph trên mặt đất." },
    ],
  },
  "marvel-rivals": {
    tagline: "Hero shooter PvP 6v6, nơi phối hợp nhân vật, combo đội hình và địa hình phá hủy tạo đột biến.",
    highlights: ["Dàn anh hùng và phản diện Marvel", "Team-Up Skills khi ghép nhân vật phù hợp", "Địa hình có thể phá hủy để đổi lợi thế"],
    beginnerGuide: [
      { title: "Học hai hero có vai trò khác nhau", detail: "Thử một hero thiên về gây sát thương và một hero thiên về bảo vệ/hỗ trợ để hiểu nhu cầu của đội." },
      { title: "Đánh theo mục tiêu", detail: "Giữ vị trí quanh điểm tranh chấp và phối hợp khi đội đã tập trung; hạ gục không thay thế việc kiểm soát mục tiêu." },
      { title: "Tận dụng team-up và địa hình", detail: "Xem điều kiện Team-Up Skills trong đội hình và dùng vật che chắn khi hồi kỹ năng hoặc cần đổi góc tấn công." },
    ],
    video: { id: "DA4iVv4MARE", title: "Marvel Rivals — Official Announcement Trailer", source: "Marvel Entertainment" },
    pcRequirements: {
      minimum: ["Windows 10 64-bit (1909 trở lên)", "CPU: Intel Core i5-6600K hoặc AMD Ryzen 5 1600X", "RAM: 16 GB", "GPU: NVIDIA GTX 1060 / AMD RX 580 / Intel Arc A380", "DirectX 12; 70 GB dung lượng trống; nên cài SSD"],
      recommended: ["Windows 10 64-bit (1909 trở lên)", "CPU: Intel Core i5-10400 hoặc AMD Ryzen 5 5600X", "RAM: 16 GB", "GPU: NVIDIA RTX 2060 Super / AMD RX 5700-XT / Intel Arc A750", "DirectX 12; 70 GB dung lượng trống; nên cài SSD"],
      sourceUrl: "https://www.marvelrivals.com/news/20241203/40185_1197705.html",
      sourceLabel: "Trang tin chính thức Marvel Rivals",
      note: "Đây là yêu cầu PC do nhà phát hành công bố; các bản cập nhật có thể làm thay đổi dung lượng cần thiết.",
    },
  },
  "helldivers-2": {
    tagline: "Co-op shooter PvE hỗn loạn, nơi phối hợp và kỷ luật hỏa lực giúp cả đội sống sót.",
    highlights: ["Nhiệm vụ tổ đội chống kẻ thù ngoài hành tinh", "Stratagem gọi tiếp viện và hỏa lực", "Bắn nhầm đồng đội là rủi ro cần luôn tính đến"],
    beginnerGuide: [
      { title: "Chọn độ khó phù hợp", detail: "Bắt đầu ở độ khó dễ để học mục tiêu nhiệm vụ, cách gọi stratagem và đường rút trước khi tăng cấp." },
      { title: "Để ý vị trí đồng đội", detail: "Hỏa lực diện rộng có thể gây sát thương cho đồng minh; báo trước khi gọi không kích hoặc đặt sentry." },
      { title: "Hoàn thành mục tiêu rồi rút", detail: "Không cần đánh mọi đợt địch. Ưu tiên mục tiêu nhiệm vụ, nhặt tài nguyên an toàn và đến điểm sơ tán cùng đội." },
    ],
  },
};

const steamAppIds: Record<string, string> = {
  "counter-strike-2": "730",
  "apex-legends": "1172470",
  "elden-ring": "1245620",
  "pubg-battlegrounds": "578080",
  "dota-2": "570",
  "overwatch-2": "2357570",
  "call-of-duty-warzone": "1938090",
  "zenless-zone-zero": "4162040",
  "black-myth-wukong": "2358720",
  "stardew-valley": "413150",
  "ea-sports-fc-26": "3405690",
  "the-witcher-3": "292030",
  "final-fantasy-xiv": "39210",
  "marvel-rivals": "2767030",
  "helldivers-2": "553850",
};

const categoryDefaults: Record<string, Pick<GameEditorial, "tagline" | "highlights" | "beginnerGuide">> = {
  FPS: {
    tagline: "FPS đòi hỏi kỹ năng ngắm bắn, kiểm soát góc nhìn và lựa chọn vị trí.",
    highlights: ["Đấu súng góc nhìn thứ nhất", "Luyện aim và kiểm soát độ giật", "Thông tin giúp đội ra quyết định nhanh"],
    beginnerGuide: [
      { title: "Luyện ở một bản đồ", detail: "Tập vài góc thường gặp trước khi cố ghi nhớ toàn bộ bản đồ." },
      { title: "Giữ tâm ngắm sẵn sàng", detail: "Đặt crosshair gần tầm đầu và hạn chế di chuyển khi bắn nếu trò chơi yêu cầu độ chính xác." },
      { title: "Giao tiếp rõ ràng", detail: "Báo vị trí và thông tin hữu ích thay vì chỉ nói cảm tính sau giao tranh." },
    ],
  },
  MOBA: {
    tagline: "MOBA kết hợp quản lý tài nguyên, bản đồ và phối hợp mục tiêu cùng đồng đội.",
    highlights: ["Vai trò và đội hình có tính bổ trợ", "Kinh tế và kinh nghiệm quyết định sức mạnh", "Mục tiêu bản đồ tạo cơ hội kết thúc trận"],
    beginnerGuide: [
      { title: "Chọn một vai trò", detail: "Học nhiệm vụ của vị trí và vài nhân vật trước khi mở rộng lựa chọn." },
      { title: "Ưu tiên tài nguyên ổn định", detail: "Tập trung farm và tránh giao tranh bất lợi chỉ vì muốn tìm mạng hạ gục." },
      { title: "Theo dõi bản đồ", detail: "Di chuyển cùng đội khi tranh chấp mục tiêu quan trọng." },
    ],
  },
  "Action RPG": {
    tagline: "Action RPG kết hợp khám phá, phát triển nhân vật và chiến đấu thời gian thực.",
    highlights: ["Tiến trình nhân vật và trang bị", "Khám phá thế giới và nhiệm vụ", "Đọc nhịp tấn công để tối ưu giao tranh"],
    beginnerGuide: [
      { title: "Học bộ kỹ năng cơ bản", detail: "Nắm né, đỡ và kỹ năng chính trước khi thử combo dài." },
      { title: "Nâng cấp có trọng tâm", detail: "Ưu tiên một bộ trang bị hoặc nhân vật phù hợp với lối chơi." },
      { title: "Khám phá theo nhịp riêng", detail: "Quay lại khu vực khó sau khi có thêm cấp hoặc công cụ mới." },
    ],
  },
};

export function getGameEditorial(slug: string, category: string): GameEditorial {
  const known = editorial[slug];
  if (known) return known;
  const fallback = categoryDefaults[category] ?? {
    tagline: "Khám phá lối chơi, thử nghiệm phong cách phù hợp và tiến bộ qua từng phiên chơi.",
    highlights: ["Tìm hiểu cơ chế cốt lõi", "Thử các cách chơi khác nhau", "Theo dõi hướng dẫn chính thức và cập nhật mới"],
    beginnerGuide: [
      { title: "Hoàn thành phần hướng dẫn", detail: "Dành thời gian tìm hiểu điều khiển và mục tiêu trước khi thử nội dung nâng cao." },
      { title: "Thử từng cơ chế một", detail: "Thay đổi từng thiết lập hoặc lựa chọn để hiểu điều gì thực sự cải thiện trải nghiệm." },
      { title: "Kiểm tra nguồn chính thức", detail: "Xem ghi chú cập nhật và yêu cầu hệ thống mới nhất trước khi cài đặt." },
    ],
  };
  return { ...fallback };
}

export function getSteamScreenshotUrl(slug: string): string | undefined {
  const appId = steamAppIds[slug];
  return appId ? "https://steamcommunity.com/app/" + appId + "/screenshots/" : undefined;
}

export function getPcRequirements(slug: string): PcRequirements | undefined {
  return editorial[slug]?.pcRequirements;
}

export function getOfficialVideo(slug: string): GameEditorial["video"] {
  return editorial[slug]?.video;
}
