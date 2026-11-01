// Bộ dữ liệu 16 bức ảnh vệ tinh viễn thám độ phân giải cao (Earth Observation Imagery)
// Kết hợp ảnh quang học thực tế + Cảm biến nhiệt hồng ngoại IR (°C)

const GAME_DATA = {
    title: "FIRESAT SIMULATOR",
    subtitle: "Hệ Thống Mô Phỏng Vệ Tinh Viễn Thám Cảnh Báo Cháy Rừng",
    
    // Trọn bộ 16 ảnh vệ tinh thực tế
    photos: [
        // NHÓM 1: CÓ CHÁY (5 ẢNH - NHIỆT ĐỘ > 200°C)
        {
            id: 1,
            title: "Đốm lửa đỏ giữa tán rừng rậm",
            category: "fire",
            correctBox: "fire",
            tempCelsius: 520,
            spectrum: "HỒNG NGOẠI CAO (520°C)",
            description: "Ảnh vệ tinh viễn thám chụp đốm lửa bùng phát giữa tán cây rậm rạp, nhiệt bức xạ 520°C rất nguy hiểm.",
            hintWrong: "Nhiệt 520°C! Đốm lửa đang cháy, đưa vào Hộp ĐỎ nhé!",
            imgSrc: "assets/images/fire_1.jpg"
        },
        {
            id: 2,
            title: "Cột khói xám bốc lên sườn núi",
            category: "fire",
            correctBox: "fire",
            tempCelsius: 210,
            spectrum: "KHÓI BỨC XẠ (210°C)",
            description: "Cột khói xám cuộn trào bốc lên từ sườn đồi, đáy cột khói có nhiệt độ 210°C báo hiệu cháy âm ỉ.",
            hintWrong: "Khói xám và nhiệt 210°C là có cháy! Đưa vào Hộp ĐỎ nhé!",
            imgSrc: "assets/images/fire_2.jpg"
        },
        {
            id: 3,
            title: "Đốm lửa trại ven hồ sát bìa rừng",
            category: "fire",
            correctBox: "fire",
            tempCelsius: 380,
            spectrum: "NHIỆT CAO BÌA RỪNG (380°C)",
            description: "Đốm lửa bập bùng trên bãi đất ven hồ sát bìa rừng thông, nhiệt 380°C có nguy cơ tàn bay cháy lan.",
            hintWrong: "Nhiệt 380°C sát rừng rất nguy hiểm! Đưa vào Hộp ĐỎ nhé!",
            imgSrc: "assets/images/fire_3.jpg"
        },
        {
            id: 4,
            title: "Tàn than hồng âm ỉ dưới thảm lá khô",
            category: "fire",
            correctBox: "fire",
            tempCelsius: 320,
            spectrum: "NHIỆT NGẦM NGUY HIỂM (320°C)",
            description: "Bức xạ hồng ngoại phát hiện mảng than hồng 320°C đang cháy ngầm dưới thảm mùn thực vật khô.",
            hintWrong: "Cháy ngầm nhiệt độ 320°C! Đưa vào Hộp ĐỎ nhé!",
            imgSrc: "assets/images/fire_4.jpg"
        },
        {
            id: 5,
            title: "Vệt cháy rừng bùng phát sườn đồi",
            category: "fire",
            correctBox: "fire",
            tempCelsius: 460,
            spectrum: "ĐƯỜNG LỬA CHÁY RỪNG (460°C)",
            description: "Vệt lửa dài bùng lên dọc sườn núi rừng thông, bức xạ nhiệt 460°C kèm khói dày đặc.",
            hintWrong: "Vệt lửa bùng phát 460°C! Đưa ngay vào Hộp ĐỎ nhé!",
            imgSrc: "assets/images/fire_5.jpg"
        },

        // NHÓM 2: AN TOÀN / BÁO ĐỘNG GIẢ (7 ẢNH - NHIỆT ĐỘ < 60°C)
        {
            id: 6,
            title: "Mái tôn nhà máy lóa nắng (Báo động giả)",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 48,
            spectrum: "PHẢN XẠ QUANG HỌC (48°C)",
            description: "Mắt người nhìn thấy ánh sáng trắng chói lọi, nhưng cảm biến vệ tinh đo nhiệt độ chỉ có 48°C (ấm do nắng trưa, không phải lửa).",
            hintWrong: "Chỉ 48°C, là mái tôn phản nắng! Đưa vào Hộp XANH!",
            imgSrc: "assets/images/safe_1.jpg"
        },
        {
            id: 7,
            title: "Trang trại pin mặt trời phản quang",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 42,
            spectrum: "TẤM PIN PHẢN QUANG (42°C)",
            description: "Cánh đồng pin mặt trời rộng lớn phản chiếu ánh nắng lấp lánh, nhiệt độ vận hành 42°C an toàn.",
            hintWrong: "Pin mặt trời chỉ 42°C, an toàn! Đưa vào Hộp XANH!",
            imgSrc: "assets/images/safe_2.jpg"
        },
        {
            id: 8,
            title: "Mặt hồ nước xanh mát rượi",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 22,
            spectrum: "MÁT MẺ AN TOÀN (22°C)",
            description: "Hồ nước tự nhiên trong xanh giữa rừng già, nhiệt độ mát mẻ 22°C tuyệt đối an toàn.",
            hintWrong: "Hồ nước mát 22°C, an toàn! Đưa vào Hộp XANH nhé!",
            imgSrc: "assets/images/safe_3.jpg"
        },
        {
            id: 9,
            title: "Đám mây trắng sườn đồi bồng bềnh",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 15,
            spectrum: "MÂY TỰ NHIÊN MÁT LẠNH (15°C)",
            description: "Đám mây ngưng tụ hơi nước trắng mịn phủ bóng râm mát trên các quả đồi, nhiệt độ 15°C.",
            hintWrong: "Mây trắng tự nhiên 15°C! Đưa vào Hộp XANH nhé!",
            imgSrc: "assets/images/safe_4.jpg"
        },
        {
            id: 10,
            title: "Dòng sông uốn lượn qua rừng nguyên sinh",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 20,
            spectrum: "DÒNG NƯỚC TỰ NHIÊN (20°C)",
            description: "Dòng sông xanh biếc chảy uốn khúc qua rừng già bạt ngàn, nhiệt độ 20°C thanh bình.",
            hintWrong: "Dòng sông nước mát 20°C! Đưa vào Hộp XANH nhé!",
            imgSrc: "assets/images/safe_5.jpg"
        },
        {
            id: 11,
            title: "Vách núi đá vôi xám khô cằn",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 32,
            spectrum: "ĐỊA HÌNH ĐÁ TỰ NHIÊN (32°C)",
            description: "Khối núi đá vôi xám sừng sững phơi nắng ấm 32°C, không có thảm thực vật cháy.",
            hintWrong: "Vách núi đá ấm 32°C! Đưa vào Hộp XANH nhé!",
            imgSrc: "assets/images/safe_6.jpg"
        },
        {
            id: 12,
            title: "Sương mù sáng sớm bao phủ thung lũng",
            category: "safe",
            correctBox: "safe",
            tempCelsius: 12,
            spectrum: "SƯƠNG MÙ LẠNH (12°C)",
            description: "Làn sương mỏng hơi nước se lạnh 12°C giăng mắc khắp các tán cây thung lũng vào sáng sớm.",
            hintWrong: "Sương mù mát lạnh 12°C! Đưa vào Hộp XANH nhé!",
            imgSrc: "assets/images/safe_7.jpg"
        },

        // NHÓM 3: ẢNH LỖI / XÓA BỎ (4 ẢNH - CẢM BIẾN LỖI/CHE KHUẤT)
        {
            id: 13,
            title: "Ảnh hỏng: Mây giông đen kín 100%",
            category: "trash",
            correctBox: "trash",
            tempCelsius: 0,
            spectrum: "TẦM NHÌN BỊ MẤT (ERR)",
            description: "Khối mây đen giông bão dày đặc che kín hoàn toàn mặt đất, cảm biến không thu nhận được dữ liệu rừng.",
            hintWrong: "Mây đen che kín mất dữ liệu! Bỏ vào THÙNG RÁC!",
            imgSrc: "assets/images/trash_1.jpg"
        },
        {
            id: 14,
            title: "Ảnh hỏng: Nắp màn trập ống kính bị kẹt",
            category: "trash",
            correctBox: "trash",
            tempCelsius: 0,
            spectrum: "SENSOR OCCLUDED (ERR)",
            description: "Lỗi cơ khí: Cửa chắn sáng camera vệ tinh bị kẹt một góc, hình ảnh không có thông tin thực tế.",
            hintWrong: "Kẹt màn trập ống kính! Bỏ vào THÙNG RÁC!",
            imgSrc: "assets/images/trash_2.jpg"
        },
        {
            id: 15,
            title: "Ảnh hỏng: Nhiễu truyền dẫn vô tuyến",
            category: "trash",
            correctBox: "trash",
            tempCelsius: 0,
            spectrum: "TELEMETRY CORRUPTED (ERR)",
            description: "Tín hiệu truyền từ vệ tinh về mặt đất bị bão từ làm gián đoạn, sinh ra các vệt sọc sặc sỡ và mất khối điểm ảnh.",
            hintWrong: "Nhiễu tín hiệu truyền dẫn! Bỏ vào THÙNG RÁC!",
            imgSrc: "assets/images/trash_3.jpg"
        },
        {
            id: 16,
            title: "Ảnh hỏng: Cảm biến quang học cháy sáng",
            category: "trash",
            correctBox: "trash",
            tempCelsius: 0,
            spectrum: "OVEREXPOSURE ERROR (ERR)",
            description: "Cảm biến bị quá tải ánh sáng dẫn tới ảnh bị cháy trắng xóa 100%, không còn nhận diện được địa hình.",
            hintWrong: "Cảm biến bị cháy sáng trắng! Bỏ vào THÙNG RÁC!",
            imgSrc: "assets/images/trash_4.jpg"
        }
    ],

    // Màn 4: Tọa độ đốm cháy 5m x 5m và đốm báo động giả
    patrolTargets: [
        {
            id: 'real-fire',
            type: 'fire',
            tempCelsius: 510,
            label: "ĐỐM CHÁY THẬT (5m × 5m)",
            coords: "105.7°E • 20.3°N",
            coordsFull: "Kinh độ: 105.7°E - Vĩ độ: 20.3°N",
            hint: "Nhiệt độ 510°C cực cao! Đây chính là đốm lửa thật cần dập tắt ngay!"
        },
        {
            id: 'fake-glare',
            type: 'fake',
            tempCelsius: 48,
            label: "MÁI TÔN PHẢN NẮNG",
            coords: "105.4°E • 20.1°N",
            coordsFull: "Kinh độ: 105.4°E - Vĩ độ: 20.1°N",
            hint: "Khoan đã! Nhiệt độ chỉ 48°C (ấm do nắng), đây chỉ là mái tôn nhà xưởng, không phải cháy rừng!"
        }
    ],

    // Dữ liệu kịch bản dẫn truyện & giao nhiệm vụ cho từng màn chơi
    stageBriefings: {
        1: {
            stageTag: "GIAI ĐOẠN 1 / 4",
            title: "THU THẬP DỮ LIỆU VIỄN THÁM",
            icon: "🛰️",
            story: "Vệ tinh FireSat đang bay quanh Trái Đất để thu thập dữ liệu huấn luyện AI nhận diện cháy rừng.",
            mission: "Canh chùm quét trùm lên các tọa độ rồi click chuột để chụp đủ 16 ảnh viễn thám.",
            btnText: "🚀 BẮT ĐẦU THU THẬP"
        },
        2: {
            stageTag: "GIAI ĐOẠN 2 / 4",
            title: "LỌC DỮ LIỆU & PHÂN LOẠI NHIỆT ĐỘ",
            icon: "🌡️",
            story: "16 ảnh gửi về gồm đám cháy thật, cảnh an toàn phản nắng (mái tôn, hồ nước) và ảnh lỗi cảm biến.",
            mission: "Quan sát ảnh và nhiệt kế hồng ngoại để kéo thẻ vào 3 khay: Đốm Cháy (>200°C), An Toàn (<60°C) hoặc Ảnh Lỗi (ERR).",
            btnText: "🧹 BẮT ĐẦU LỌC DỮ LIỆU"
        },
        3: {
            stageTag: "GIAI ĐOẠN 3 / 4",
            title: "HUẤN LUYỆN MÔ HÌNH AI",
            icon: "🧠",
            story: "Kết hợp các nguồn dữ liệu cảm biến và tinh chỉnh tham số để mạng nơ-ron AI đạt độ chính xác cao nhất.",
            mission: "Thử cắm/rút các loại cảm biến, kéo thanh trượt điều chỉnh nhiệt độ và số lần học để tìm ra công thức tối ưu cho AI.",
            btnText: "⚙️ BẮT ĐẦU HUẤN LUYỆN"
        },
        4: {
            stageTag: "GIAI ĐOẠN 4 / 4",
            title: "ỨNG DỤNG GIÁM SÁT VÀ DẬP LỬA",
            icon: "🚁",
            story: "AI phát hiện 2 vật thể A và B trong rừng già, một điểm là lửa thật 5m × 5m, một điểm là mái tôn lóa nắng.",
            mission: "Kiểm tra nhiệt độ, khóa đúng đốm cháy thật (510°C) và bấm nút Phát lệnh dập lửa trước khi hết giờ.",
            btnText: "🚨 BẮT ĐẦU ỨNG DỤNG"
        }
    }
};

window.GAME_DATA = GAME_DATA;
