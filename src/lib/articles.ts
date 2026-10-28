export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
  sections: ArticleSection[];
};

export const articles: Article[] = [
  {
    slug: "chon-game-theo-cau-hinh",
    category: "PC GUIDE",
    title: "Chọn game phù hợp với cấu hình PC",
    excerpt: "Cách đọc yêu cầu hệ thống, phân biệt cấu hình tối thiểu và đề nghị, rồi kiểm tra những thành phần thường bị bỏ quên.",
    readingTime: "5 phút",
    sections: [
      {
        heading: "Đọc cấu hình tối thiểu và đề nghị",
        paragraphs: [
          "Cấu hình tối thiểu thường nhắm đến khả năng chạy game ở mức thiết lập thấp hơn. Cấu hình đề nghị là điểm khởi đầu hợp lý hơn nếu bạn muốn hình ảnh ổn định và ít phải giảm chất lượng đồ họa.",
          "Đừng chỉ nhìn tên CPU hoặc card đồ họa. Hãy đối chiếu thế hệ phần cứng, dung lượng RAM, dung lượng lưu trữ và hệ điều hành mà nhà phát hành công bố."
        ]
      },
      {
        heading: "Ba thành phần nên kiểm tra trước",
        paragraphs: [
          "GPU thường ảnh hưởng lớn đến hiệu năng đồ họa; CPU có thể trở thành giới hạn trong game nhiều người chơi hoặc mô phỏng; RAM và VRAM thiếu hụt có thể gây giật khung hình khi tải tài nguyên.",
          "Nếu có thể, hãy tìm bài kiểm tra hiệu năng với cấu hình gần giống máy của bạn. Kết quả thực tế hữu ích hơn việc so sánh thông số trên giấy."
        ]
      },
      {
        heading: "Đặt kỳ vọng đúng",
        paragraphs: [
          "Mục tiêu 1080p/60 FPS khác đáng kể so với 1440p hoặc 4K ở tần số quét cao. Hãy xác định độ phân giải, mức FPS mong muốn và mức thiết lập đồ họa trước khi quyết định nâng cấp."
        ]
      }
    ]
  },
  {
    slug: "toi-uu-fps",
    category: "PERFORMANCE",
    title: "Checklist tối ưu FPS mà không làm hỏng trải nghiệm",
    excerpt: "Những bước kiểm tra an toàn từ driver, thiết lập đồ họa đến nhiệt độ trước khi cài các công cụ tối ưu không rõ nguồn gốc.",
    readingTime: "4 phút",
    sections: [
      {
        heading: "Đo trước khi chỉnh",
        paragraphs: [
          "Ghi lại FPS trung bình, độ ổn định khung hình và nhiệt độ trong cùng một tình huống chơi. Nếu không có mốc ban đầu, bạn khó biết thay đổi nào thực sự có ích.",
          "Đóng ứng dụng nền không cần thiết, cập nhật driver từ nhà sản xuất và kiểm tra game đang sử dụng đúng GPU hiệu năng cao nếu máy có nhiều GPU."
        ]
      },
      {
        heading: "Ưu tiên thiết lập có tác động lớn",
        paragraphs: [
          "Độ phân giải, ray tracing, bóng đổ và một số hiệu ứng hậu kỳ có thể tác động mạnh đến hiệu năng. Hạ từng thiết lập một rồi kiểm tra lại thay vì đổi mọi thứ cùng lúc.",
          "Giới hạn FPS phù hợp với màn hình có thể giúp khung hình ổn định và giảm tải nhiệt. Với laptop, hãy kiểm tra chế độ nguồn và đảm bảo khe tản nhiệt không bị che."
        ]
      },
      {
        heading: "Tránh công cụ không rõ nguồn gốc",
        paragraphs: [
          "Không cần tải các file thực thi hoặc script lạ chỉ vì lời hứa tăng FPS. Những công cụ đó có thể làm giảm bảo mật, thay đổi thiết lập ngoài ý muốn hoặc vi phạm điều khoản của trò chơi."
        ]
      }
    ]
  },
  {
    slug: "danh-gia-game-cong-tam",
    category: "LEVELUP EDITORIAL",
    title: "Cách viết review game hữu ích cho cộng đồng",
    excerpt: "Một bài đánh giá tốt không chỉ là điểm số: hãy nói rõ bối cảnh chơi, điểm mạnh, hạn chế và ai sẽ phù hợp với game.",
    readingTime: "4 phút",
    sections: [
      {
        heading: "Nêu rõ bối cảnh trải nghiệm",
        paragraphs: [
          "Hãy nói bạn chơi trên nền tảng nào, khoảng thời gian trải nghiệm và chế độ chơi nào được kiểm tra. Bối cảnh giúp người đọc hiểu giới hạn của nhận xét.",
          "Nếu đánh giá hiệu năng, ghi rõ cấu hình và thiết lập quan trọng. Không nên biến một trải nghiệm cá nhân thành kết luận áp dụng cho mọi thiết bị."
        ]
      },
      {
        heading: "Tách ưu điểm khỏi hạn chế",
        paragraphs: [
          "Đánh giá gameplay, thiết kế màn chơi, câu chuyện, khả năng tiếp cận và hiệu năng theo từng khía cạnh. Một game có thể rất tốt ở một mặt nhưng chưa phù hợp ở mặt khác.",
          "Dùng ví dụ cụ thể thay vì chỉ nói game hay hoặc dở. Đồng thời, hãy công khai nếu bài viết có tài trợ hoặc quyền lợi liên quan."
        ]
      },
      {
        heading: "Kết luận cho đúng đối tượng",
        paragraphs: [
          "Thay vì chỉ đưa ra một điểm số, hãy giải thích ai có thể thích trò chơi, ai có thể không phù hợp và những yếu tố nào nên cân nhắc trước khi mua hoặc tải."
        ]
      }
    ]
  }
];
