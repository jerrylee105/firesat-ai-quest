# KỊCH BẢN CHI TIẾT GAME: FIRESAT AI QUEST (VỆ TINH CANH GÁC RỪNG XANH)
> **Tài liệu đặc tả thiết kế Game (Game Design Document - GDD) phục vụ lập trình Mini-game mô phỏng AI cho học sinh Tiểu học (Khối 4)**  
> **Nền tảng công nghệ gợi ý:** HTML5 / Canvas / React / Phaser hoặc Scratch 3.0  
> **Thời lượng trải nghiệm:** 5 - 8 phút  
> **Mục tiêu giáo dục:** Trực quan hóa chu trình Học máy 4 bước (Thu thập $\to$ Lọc $\to$ Huấn luyện $\to$ Sử dụng) phỏng theo dự án vệ tinh FireSat thực tế của Google Research.

---

## 1. TỔNG QUAN DỰ ÁN & BỐI CẢNH (GAME OVERVIEW)
- **Tên trò chơi:** FireSat AI Quest (Mắt Thần Canh Rừng Xanh)
- **Cốt truyện:** Rừng già đang đứng trước nguy cơ cháy rừng do biến đổi khí hậu. Các vệ tinh truyền thống chỉ phát hiện được đám cháy khi nó đã lớn bằng cả sân bóng đá. Người chơi đóng vai Kỹ sư AI nhí của dự án Google FireSat, có nhiệm vụ xây dựng bộ não AI gắn trên chùm vệ tinh vũ trụ để phát hiện sớm các đốm lửa nhỏ chỉ $5m \times 5m$ ngay khi mới bùng phát, gửi cảnh báo dập lửa cứu rừng.
- **Phong cách đồ họa (Visual Style):** Pixel art hoặc Vector hoạt hình 2D tươi sáng, thân thiện với học sinh lứa tuổi 9-10 (Khối 4). Gam màu chủ đạo: Xanh lá cây (Rừng), Xanh dương đậm / Đen tím vũ trụ (Không gian vệ tinh), Đỏ/Cam (Lửa và Báo động).
- **Âm thanh (Audio):** 
  - Nhạc nền nhẹ nhàng, mang hơi hướng công nghệ (Lo-fi Sci-fi / Tech beats).
  - Sound effects (SFX): Tiếng "Tách" khi chụp ảnh, tiếng "Tít tít" khi máy nạp dữ liệu, tiếng "Bíp bíp" radar quét, tiếng còi báo động khẩn cấp nhẹ nhàng, tiếng xịt nước dập lửa và âm thanh chiến thắng vui nhộn.

---

## 2. CƠ CHẾ VÒNG LẶP TRÒ CHƠI (CORE GAME LOOP)

```
[Màn 1: Thu thập ảnh vệ tinh] ──► [Màn 2: Lọc & Gán nhãn] ──► [Màn 3: Huấn luyện AI] ──► [Màn 4: Tuần tra & Báo cháy]
```

---

## 3. THIẾT KẾ CHI TIẾT 4 MÀN CHƠI (4 LEVELS)

### 🛰️ MÀN 1: THU THẬP DỮ LIỆU (DATA COLLECTION)
* **Mục tiêu:** Giúp học sinh hiểu máy tính không tự nhiên có dữ liệu, con người/vệ tinh phải đi thu thập từ thế giới thực.
* **Giao diện (UI):**
  - Màn hình hiển thị quả địa cầu / bản đồ khu rừng xanh nhìn từ góc quỹ đạo vệ tinh đang xoay chậm.
  - Vệ tinh FireSat bay lượn ở góc trên màn hình, phát ra khung ngắm camera hình chữ nhật.
  - Các điểm phát sáng/vùng rừng nhấp nháy xuất hiện ngẫu nhiên trên bản đồ.
  - Góc trên bên phải: Thanh đếm ảnh `Dữ liệu thô: 0/8`.
* **Cơ chế chơi (Gameplay):**
  - Học sinh nhấp chuột (hoặc chạm màn hình) vào các điểm nhấp nháy trên bản đồ để "Chụp ảnh vệ tinh".
  - Mỗi cú nhấp sẽ phát ra tiếng "Tách" và bức ảnh vừa chụp thu nhỏ bay vào giỏ lưu trữ dữ liệu.
  - Người chơi chụp đủ **8 bức ảnh** để qua màn.
* **Bộ 8 ảnh mẫu thu thập được:**
  1. Đốm lửa nhỏ đỏ rực giữa rừng cây.
  2. Cột khói xám bốc lên từ sườn núi.
  3. Mái tôn nhà máy phản chiếu ánh nắng chói chang.
  4. Đám mây trắng dày đặc che phủ sườn đồi.
  5. Đốm lửa trại nhỏ của người cắm trại ven hồ.
  6. Mặt hồ nước trong xanh phản chiếu bầu trời.
  7. Bức ảnh bị hỏng: Mây đen tối thui che kín 100% không thấy mặt đất.
  8. Bức ảnh bị hỏng: Ống kính bị che, chỉ thấy một mảng đen vũ trụ.

---

### 🧹 MÀN 2: LỌC & LÀM SẠCH DỮ LIỆU (DATA CLEANING & LABELING)
* **Mục tiêu:** Trải nghiệm khâu quan trọng nhất của Học máy có giám sát (Supervised Learning): loại bỏ dữ liệu rác/nhiễu và gán nhãn chính xác cho dữ liệu học tập.
* **Giao diện (UI):**
  - Bàn làm việc của Kỹ sư AI.
  - Ở giữa: Khung hiển thị lần lượt từng bức ảnh thu thập được từ Màn 1.
  - Bên trái: **Thùng rác màu Xám** (Dán nhãn: `ẢNH LỖI / XÓA BỎ`).
  - Phía dưới bên trái: **Hộp màu Đỏ** (Dán nhãn: `CÓ CHÁY - BÁO ĐỘNG`).
  - Phía dưới bên phải: **Hộp màu Xanh** (Dán nhãn: `AN TOÀN - KHÔNG CHÁY`).
* **Cơ chế chơi (Gameplay):**
  - Học sinh kéo thả (Drag & Drop) hoặc bấm nút lựa chọn tương ứng cho từng bức ảnh:
    * **Hành động 1 - Lọc ảnh lỗi:** Với 2 bức ảnh tối đen che kín $\to$ Kéo vào `Thùng rác`. Màn hình hiện thông báo nhỏ: *"Đã xóa ảnh nhiễu! Dữ liệu sạch hơn!"*.
    * **Hành động 2 - Gán nhãn ảnh:**
      - Ảnh 1 (Đốm lửa đỏ): Kéo vào `Hộp Đỏ (CÓ CHÁY)`.
      - Ảnh 2 (Cột khói xám): Kéo vào `Hộp Đỏ (CÓ CHÁY)`.
      - Ảnh 3 (Mái tôn lóa nắng): Kéo vào `Hộp Xanh (AN TOÀN - BÁO ĐỘNG GIẢ)`.
      - Ảnh 4 (Đám mây trắng/sương mù): Kéo vào `Hộp Xanh (AN TOÀN)`.
      - Ảnh 5 (Lửa trại ven hồ): Kéo vào `Hộp Đỏ (CÓ CHÁY)`.
      - Ảnh 6 (Mặt hồ nước): Kéo vào `Hộp Xanh (AN TOÀN)`.
  - Nếu học sinh kéo nhầm (ví dụ kéo mái tôn vào Hộp Đỏ), nhân vật trợ lý AI sẽ lắc đầu nhẹ và nhắc: *"Nhìn kỹ nhé, đây chỉ là ánh nắng phản chiếu mái tôn thôi, không phải lửa đâu!"*.
* **Kết quả:** Đạt đủ 6 ảnh gán nhãn chuẩn và 2 ảnh rác bị loại bỏ. Nút `TIẾP TỤC HUẤN LUYỆN` phát sáng rực rỡ.

---

### ⚙️ MÀN 3: HUẤN LUYỆN MÔ HÌNH AI (MODEL TRAINING)
* **Mục tiêu:** Học sinh hiểu mô hình AI cần được nạp dữ liệu sạch để tính toán và học các đặc trưng nhiệt/hình ảnh.
* **Giao diện (UI):**
  - Đồ họa hiển thị "Bộ não siêu máy tính FireSat" với các mạng nơ-ron phát sáng.
  - Ở giữa có một nút lớn nhấp nháy: `[ BẮT ĐẦU HUẤN LUYỆN AI ]`.
* **Cơ chế chơi (Gameplay):**
  - Học sinh nhấn vào nút Huấn luyện.
  - Hiệu ứng thị giác diễn ra tự động trong khoảng 4 - 6 giây:
    * 6 bức ảnh đã gán nhãn chạy nhanh qua bộ não AI.
    * Các tia sáng nơ-ron kết nối nhấp nháy liên tục.
    * Thanh phần trăm (Progress bar) tăng dần: `15%... 45%... 80%... 100%!`.
    * Âm thanh công nghệ: `Píp... píp... Vùuu!`
  - Kết quả hiển thị popup chúc mừng:
    * *"Huấn luyện thành công!"*
    * *"Độ chính xác: 99.2%"*
    * *"Mô hình AI đã sẵn sàng nạp lên vệ tinh FireSat!"*
  - Học sinh bấm nút `[ PHÓNG VỆ TINH TUẦN TRA ]` để vào màn cuối.

---

### 🚀 MÀN 4: SỬ DỤNG VỆ TINH CANH RỪNG (INFERENCE & DEPLOYMENT)

* **Mục tiêu:** Trải nghiệm kết quả ứng dụng thực tế ngoài đời sống của AI: phát hiện sớm đám cháy siêu nhỏ 5m x 5m và kích hoạt cứu rừng khẩn cấp.
* **Giao diện (UI):**
  * Khung nhìn từ vệ tinh FireSat: Toàn cảnh khu rừng già nguyên sinh xanh mát.
  * Vệ tinh quét một chùm tia laser radar xanh qua lại trên bề mặt tán rừng.
  * Góc dưới màn hình có một **Nút bấm Báo động lớn màu Đỏ**: `[ PHÁT LỆNH DẬP LỬA KHẨN CẤP ]`.
* **Cơ chế chơi (Gameplay):**
  * Khi vệ tinh quét đến góc dưới khu rừng, bất ngờ xuất hiện một đốm nhiệt nhỏ xíu (kích thước $5m \times 5m$) và một làn khói mỏng bắt đầu bốc lên.
  * **Bộ não AI tự động kích hoạt:**
    * Khung viền đỏ nhấp nháy khóa chặt vào đốm lửa: `[!] PHÁT HIỆN ĐỐM CHÁY 5m x 5m`.
    * Tọa độ hiện lên: `Kinh độ: 105.7°E - Vĩ độ: 20.3°N`.
    * Đèn cảnh báo nhấp nháy: `CẦN XỬ LÝ GẤP!`.
  * **Thao tác của học sinh:** Nhanh tay bấm vào nút đỏ `[ PHÁT LỆNH DẬP LỬA KHẨN CẤP ]` trước khi thanh đếm thời gian (10 giây) trôi hết.
  * **Hiệu ứng kết thúc (Victory Sequence):**
    * Tín hiệu sóng truyền từ vệ tinh vũ trụ xuống tháp kiểm lâm mặt đất.
    * Âm thanh trực thăng cứu hỏa bay đến `Phành phạch... Phành phạch...`.
    * Trực thăng xả một luồng nước dập tắt hoàn toàn đốm lửa khi nó chưa kịp bén sang các cây cổ thụ xung quanh.
    * Đám khói tan biến, khu rừng lại xanh tươi thanh bình.
* **Màn hình vinh danh (Game Over / Victory Screen):**
  * Dòng chữ lớn: **"NHIỆM VỤ HOÀN THÀNH XUẤT SẮC!"**
  * Bảng tổng kết thông số:
    * *Đốm cháy phát hiện:* $5m \times 5m$ (Siêu sớm!)
    * *Thời gian cảnh báo:* Ngay lập tức (Dưới 20 phút)
    * *Diện tích rừng được cứu:* 10.000 héc-ta rừng nguyên sinh!
  * Nút: `[ CHƠI LẠI ]`  
