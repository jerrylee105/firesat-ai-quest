// 3D Cel-Shaded Earth Rotating Globe Simulator cho FireSat AI Quest
// Chuẩn phong cách đồ họa Google AI Quest:
// - Sutherland-Hodgman Horizon Culling: Khắc phục 100% lỗi méo mó và chồng chéo khi quả cầu xoay
// - Tầng địa chất đa lớp & Mây cố định theo địa lý chân thực
// - Vệt quét vệ tinh đa trục quét rộng bao quát toàn cầu từ Bắc tới Nam
// - Vệ tinh bay quỹ đạo 3D thực thụ (che khuất sau lưng Trái Đất)

class Earth3DGlobe {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;

        // Góc xoay địa cầu
        this.rotation = 0;
        this.rotationSpeed = 0.0030;

        // Quỹ đạo 3D thực thụ của Vệ tinh (X, Y, Z)
        this.orbitTime = 0;
        this.satX = 0;
        this.satY = 0;
        this.satZ = 1; // Z dương: phía trước Trái Đất; Z âm: phía sau lưng Trái Đất
        this.targetReticle = { x: 0, y: 0, rx: 64, ry: 38, angle: 0, active: false, locked: false, lockedTarget: null };
        this.scanBeamX = 0;
        this.scanBeamY = 0;
        this.targetSeekAno = null;
        this.seekDwellTimer = 0;

        // Asset ảnh vệ tinh Cel-shaded & Bộ xử lý tách nền trong suốt tự động
        this.satImg = new Image();
        this.satImg.onload = () => this.processSatelliteImage();
        this.satImg.src = 'assets/images/cel_satellite.jpg';
        this.transparentSatCanvas = null;

        if (this.satImg.complete && this.satImg.naturalWidth > 0) {
            this.processSatelliteImage();
        }

        // 16 Tọa độ trinh sát viễn thám thực tế (Chỉ hiển thị tên khu vực, đồng bộ màu HUD Radar viễn thám)
        this.anomalies = [
            // 5 Đốm Cháy rừng thật (Thermal Hotspots)
            { id: 1, lat: 21.4, lon: 104.2, type: 'fire', label: 'KHU VỰC 01: RỪNG NÚI TÂY BẮC', color: '#ffea00', active: false, pingTime: 0, captured: false },
            { id: 2, lat: 37.8, lon: -119.5, type: 'fire', label: 'KHU VỰC 02: DÃY SIERRA NEVADA', color: '#ffea00', active: false, pingTime: 0, captured: false },
            { id: 3, lat: -3.5, lon: -62.0, type: 'fire', label: 'KHU VỰC 03: RỪNG MƯA AMAZON', color: '#ffea00', active: false, pingTime: 0, captured: false },
            { id: 4, lat: -23.5, lon: 133.8, type: 'fire', label: 'KHU VỰC 04: ĐỒNG CỎ BẮC ÚC', color: '#ffea00', active: false, pingTime: 0, captured: false },
            { id: 5, lat: 58.2, lon: 98.5, type: 'fire', label: 'KHU VỰC 05: RỪNG TAIGA SIBERIA', color: '#ffea00', active: false, pingTime: 0, captured: false },

            // 7 Cảnh quan An toàn / Báo động quang học giả (Safe Landscapes)
            { id: 6, lat: 10.8, lon: 106.7, type: 'safe', label: 'KHU VỰC 06: KHU DÂN CƯ NAM BỘ', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 7, lat: 36.2, lon: -115.1, type: 'safe', label: 'KHU VỰC 07: THUNG LŨNG NEVADA', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 8, lat: 46.5, lon: -87.4, type: 'safe', label: 'KHU VỰC 08: VÙNG NGŨ ĐẠI HỒ', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 9, lat: 2.5, lon: 22.8, type: 'safe', label: 'KHU VỰC 09: RỪNG LƯU VỰC CONGO', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 10, lat: 10.1, lon: 105.7, type: 'safe', label: 'KHU VỰC 10: ĐỒNG BẰNG MEKONG', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 11, lat: 28.6, lon: 85.5, type: 'safe', label: 'KHU VỰC 11: CAO NGUYÊN HIMALAYA', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 12, lat: 22.3, lon: 103.8, type: 'safe', label: 'KHU VỰC 12: ĐỈNH HOÀNG LIÊN SƠN', color: '#00e5ff', active: false, pingTime: 0, captured: false },

            // 4 Khu vực trinh sát hải đảo & khí quyển (Telemetry Stations)
            { id: 13, lat: 16.5, lon: 112.0, type: 'trash', label: 'KHU VỰC 13: QUẦN ĐẢO HOÀNG SA', color: '#ffea00', active: false, pingTime: 0, captured: false },
            { id: 14, lat: 57.5, lon: 20.0, type: 'trash', label: 'KHU VỰC 14: VÙNG BIỂN BALTIC', color: '#00e5ff', active: false, pingTime: 0, captured: false },
            { id: 15, lat: -18.7, lon: 46.8, type: 'trash', label: 'KHU VỰC 15: DUYÊN HẢI MADAGASCAR', color: '#ffea00', active: false, pingTime: 0, captured: false },
            { id: 16, lat: 3.2, lon: 6.8, type: 'trash', label: 'KHU VỰC 16: VÙNG VỊNH GUINEA', color: '#00e5ff', active: false, pingTime: 0, captured: false }
        ];

        // Mảng địa tầng lục địa chân thực có đường bờ biển uốn lượn sắc nét
        this.continents = this.generateCelShadedContinents();
        // Các dãy núi cao phủ tuyết thật
        this.mountainRanges = this.generateMountainRanges();
        // Các dải mây khí quyển tự nhiên
        this.atmosphericClouds = this.generateAtmosphericClouds();

        // Tối ưu hóa độ cong 3D cho toàn bộ đường bờ biển, núi tuyết và mây bão
        this.subdivideAllGeometries();

        // Mảnh vụn thiên thạch lơ lửng ngẫu nhiên ngoài không gian (Không pattern, nhỏ li ti, trôi bồng bềnh)
        this.asteroids = this.generateOrganicFloatingAsteroids();

        // Sao trời lấp lánh
        this.spaceStars = this.generateStars();

        this.onCaptureCallback = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        if (this.canvas.parentElement && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.canvas.parentElement);
        }

        // Kích hoạt tuần tự các điểm quan sát địa lý
        this.spawnTimer = setInterval(() => this.spawnRandomObservationSite(), 1600);

        this.render = this.render.bind(this);
        requestAnimationFrame(this.render);
    }

    generateStars() {
        const stars = [];
        for (let i = 0; i < 90; i++) {
            stars.push({
                xRatio: Math.random(),
                yRatio: Math.random(),
                radius: 0.6 + Math.random() * 1.5,
                alpha: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 0.02 + Math.random() * 0.04
            });
        }
        return stars;
    }

    resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
        const w = (rect.width && rect.width > 100) ? rect.width : (window.innerWidth || 960);
        const h = (rect.height && rect.height > 100) ? rect.height : (window.innerHeight ? Math.max(380, window.innerHeight * 0.55) : 520);

        this.width = this.canvas.width = Math.round(w);
        this.height = this.canvas.height = Math.round(h);

        this.globeRadius = Math.min(this.width, this.height) * 0.40;
        this.globeCenterX = this.width * 0.50;
        this.globeCenterY = this.height * 0.52;

        if (!this.scanBeamX || !this.scanBeamY) {
            this.scanBeamX = this.globeCenterX;
            this.scanBeamY = this.globeCenterY;
        }
    }

    // Hệ thống lục địa mô phỏng bản đồ địa lý thực tế với đường bờ biển uốn lượn tự nhiên
    generateCelShadedContinents() {
        return [
            // 1. VIỆT NAM & BÁN ĐẢO ĐÔNG DƯƠNG (Bờ biển hình chữ S uốn lượn sắc nét)
            {
                name: "Vietnam & Indochina",
                shelfColor: "#38bdf8",
                landColor: "#059669",
                points: [
                    { lat: 22.8, lon: 103.5 }, // Tây Bắc Việt Nam
                    { lat: 22.0, lon: 106.8 }, // Đông Bắc
                    { lat: 21.2, lon: 107.5 }, // Móng Cái / Vịnh Hạ Long
                    { lat: 20.2, lon: 106.2 }, // Vịnh Bắc Bộ / Thái Bình
                    { lat: 18.5, lon: 105.8 }, // Hà Tĩnh
                    { lat: 16.5, lon: 107.6 }, // Huế
                    { lat: 16.1, lon: 108.3 }, // Đà Nẵng
                    { lat: 13.8, lon: 109.3 }, // Quy Nhơn
                    { lat: 12.2, lon: 109.2 }, // Nha Trang
                    { lat: 10.8, lon: 108.1 }, // Phan Thiết
                    { lat: 10.3, lon: 107.1 }, // Vũng Tàu
                    { lat: 8.6, lon: 104.8 },  // Mũi Cà Mau
                    { lat: 10.0, lon: 104.0 }, // Phú Quốc / Kiên Giang
                    { lat: 11.5, lon: 103.0 }, // Campuchia ven Vịnh Thái Lan
                    { lat: 13.0, lon: 100.8 }, // Vịnh Bangkok Thái Lan
                    { lat: 16.5, lon: 98.5 },  // Miến Điện
                    { lat: 21.0, lon: 99.5 },  // Thượng Lào
                    { lat: 23.0, lon: 102.0 }  // Biên giới Tây Bắc
                ]
            },

            // 2. ĐÔNG Á, TRUNG QUỐC & TRIỀU TIÊN
            {
                name: "East Asia & China",
                shelfColor: "#38bdf8",
                landColor: "#15803d",
                points: [
                    { lat: 22.2, lon: 114.2 }, // Hồng Kông / Quảng Đông
                    { lat: 24.5, lon: 118.5 }, // Phúc Kiến
                    { lat: 28.5, lon: 121.5 }, // Chiết Giang
                    { lat: 31.5, lon: 121.8 }, // Thượng Hải
                    { lat: 35.0, lon: 119.5 }, // Sơn Đông
                    { lat: 38.5, lon: 118.0 }, // Vịnh Bột Hải
                    { lat: 39.8, lon: 124.5 }, // Cửa sông Áp Lục
                    { lat: 37.8, lon: 126.5 }, // Bán đảo Triều Tiên Tây
                    { lat: 35.0, lon: 129.0 }, // Busan
                    { lat: 38.5, lon: 128.5 }, // Đông Triều Tiên
                    { lat: 42.5, lon: 130.5 }, // Duyên hải Nga - Triều
                    { lat: 48.0, lon: 125.0 }, // Đông Bắc Á
                    { lat: 46.0, lon: 110.0 }, // Nội Mông
                    { lat: 38.0, lon: 98.0 },  // Cao nguyên trung tâm
                    { lat: 27.0, lon: 100.0 }  // Vân Nam
                ]
            },

            // 3. QUẦN ĐẢO NHẬT BẢN (Cánh cung duyên hải Thái Bình Dương)
            {
                name: "Japan Archipelago",
                shelfColor: "#7dd3fc",
                landColor: "#047857",
                points: [
                    { lat: 31.2, lon: 130.5 }, // Kyushu
                    { lat: 33.5, lon: 133.5 }, // Shikoku
                    { lat: 35.2, lon: 137.0 }, // Nagoya
                    { lat: 36.0, lon: 140.5 }, // Tokyo
                    { lat: 40.5, lon: 141.5 }, // Tohoku
                    { lat: 44.0, lon: 144.5 }, // Hokkaido
                    { lat: 45.2, lon: 142.0 }, // Cực bắc Hokkaido
                    { lat: 42.0, lon: 140.0 }, // Hakodate
                    { lat: 37.0, lon: 136.5 }, // Bán đảo Noto
                    { lat: 34.5, lon: 131.5 }  // Bờ tây Honshu
                ]
            },

            // 4. NAM Á & BÁN ĐẢO ẤN ĐỘ
            {
                name: "Indian Subcontinent",
                shelfColor: "#38bdf8",
                landColor: "#16a34a",
                points: [
                    { lat: 27.5, lon: 74.0 }, // Rajasthan
                    { lat: 23.5, lon: 68.5 }, // Gujarat
                    { lat: 19.0, lon: 72.8 }, // Mumbai
                    { lat: 15.0, lon: 73.8 }, // Goa
                    { lat: 8.2, lon: 77.5 },  // Mũi Comorin (Cực Nam Ấn Độ)
                    { lat: 10.5, lon: 79.8 }, // Tamil Nadu
                    { lat: 13.0, lon: 80.3 }, // Chennai
                    { lat: 17.5, lon: 83.3 }, // Andhra Pradesh
                    { lat: 21.5, lon: 87.0 }, // Odisha
                    { lat: 24.0, lon: 89.0 }, // Bengal
                    { lat: 26.5, lon: 85.0 }  // Bihar / Chân Himalaya
                ]
            },

            // 5. QUẦN ĐẢO ĐÔNG NAM Á (Mã Lai, Indonesia, Philippines)
            {
                name: "Malay & Sumatra",
                shelfColor: "#38bdf8",
                landColor: "#059669",
                points: [
                    { lat: 6.0, lon: 100.5 }, { lat: 3.0, lon: 103.5 }, { lat: 1.3, lon: 104.0 },
                    { lat: -3.0, lon: 106.0 }, { lat: -5.8, lon: 105.5 }, { lat: -3.0, lon: 101.5 },
                    { lat: 2.5, lon: 96.5 }, { lat: 5.5, lon: 95.5 }
                ]
            },
            {
                name: "Borneo Kalimantan",
                shelfColor: "#38bdf8",
                landColor: "#047857",
                points: [
                    { lat: 6.5, lon: 116.5 }, { lat: 5.0, lon: 119.0 }, { lat: 1.0, lon: 118.0 },
                    { lat: -3.5, lon: 116.0 }, { lat: -3.5, lon: 112.0 }, { lat: 1.0, lon: 109.0 },
                    { lat: 4.5, lon: 114.0 }
                ]
            },
            {
                name: "Philippines Archipelago",
                shelfColor: "#7dd3fc",
                landColor: "#10b981",
                points: [
                    { lat: 18.0, lon: 121.5 }, { lat: 15.0, lon: 121.0 }, { lat: 12.5, lon: 124.5 },
                    { lat: 7.0, lon: 126.0 }, { lat: 6.0, lon: 124.5 }, { lat: 10.0, lon: 122.5 },
                    { lat: 14.5, lon: 120.0 }
                ]
            },

            // 6. BẮC Á, SIBERIA & NGA
            {
                name: "Siberia & Northern Eurasia",
                shelfColor: "#38bdf8",
                landColor: "#047857",
                points: [
                    { lat: 50.0, lon: 60.0 }, { lat: 60.0, lon: 60.0 }, { lat: 68.0, lon: 75.0 },
                    { lat: 73.0, lon: 110.0 }, { lat: 70.0, lon: 140.0 }, { lat: 66.0, lon: 170.0 },
                    { lat: 60.0, lon: 165.0 }, { lat: 52.0, lon: 143.0 }, { lat: 48.0, lon: 135.0 },
                    { lat: 52.0, lon: 105.0 }, { lat: 50.0, lon: 85.0 }
                ]
            },

            // 7. CHÂU ÂU (Scandinavia, Tây Âu, Địa Trung Hải & Anh Quốc)
            {
                name: "Europe Mainland",
                shelfColor: "#38bdf8",
                landColor: "#059669",
                points: [
                    { lat: 55.0, lon: 8.5 },   // Đan Mạch
                    { lat: 51.0, lon: 2.5 },   // Bỉ / Pháp
                    { lat: 48.5, lon: -4.5 },  // Bán đảo Brittany
                    { lat: 43.5, lon: -1.5 },  // Vịnh Biscay
                    { lat: 43.5, lon: -9.0 },  // Bắc Tây Ban Nha
                    { lat: 37.0, lon: -9.0 },  // Bồ Đào Nha
                    { lat: 36.0, lon: -5.5 },  // Eo biển Gibraltar
                    { lat: 38.0, lon: 0.0 },   // Valencia
                    { lat: 43.5, lon: 4.0 },   // Miền Nam Pháp
                    { lat: 44.0, lon: 8.5 },   // Bờ biển Ý
                    { lat: 40.5, lon: 15.0 },  // Miền nam Ý
                    { lat: 38.0, lon: 15.5 },  // Calabria
                    { lat: 40.5, lon: 18.0 },  // Gót giày Ý
                    { lat: 45.0, lon: 13.5 },  // Venice
                    { lat: 40.0, lon: 23.0 },  // Hy Lạp
                    { lat: 43.0, lon: 28.5 },  // Biển Đen
                    { lat: 50.0, lon: 30.0 },  // Đông Âu
                    { lat: 54.0, lon: 18.0 }   // Ba Lan / Baltic
                ]
            },
            {
                name: "Scandinavia",
                shelfColor: "#7dd3fc",
                landColor: "#047857",
                points: [
                    { lat: 71.0, lon: 26.0 }, { lat: 64.0, lon: 12.0 }, { lat: 58.0, lon: 8.0 },
                    { lat: 55.5, lon: 13.0 }, { lat: 60.0, lon: 19.0 }, { lat: 65.0, lon: 24.0 }
                ]
            },
            {
                name: "British Isles",
                shelfColor: "#7dd3fc",
                landColor: "#15803d",
                points: [
                    { lat: 58.5, lon: -5.0 }, { lat: 55.0, lon: -1.5 }, { lat: 51.0, lon: 1.5 },
                    { lat: 50.0, lon: -5.0 }, { lat: 53.5, lon: -4.5 }
                ]
            },

            // 8. CHÂU PHI (Đường cong bờ biển tự nhiên từ Tây Phi qua Mũi Hảo Vọng đến Sừng châu Phi)
            {
                name: "Africa Continent",
                shelfColor: "#38bdf8",
                landColor: "#15803d",
                points: [
                    { lat: 37.0, lon: 10.0 },  // Tunisia
                    { lat: 32.0, lon: 32.0 },  // Ai Cập / Kênh Suez
                    { lat: 22.0, lon: 37.0 },  // Dọc Biển Đỏ
                    { lat: 12.0, lon: 43.5 },  // Eo Bab-el-Mandeb
                    { lat: 11.5, lon: 51.0 },  // Mũi Hafun (Sừng châu Phi)
                    { lat: 0.0, lon: 42.5 },   // Xích đạo Đông Phi
                    { lat: -12.0, lon: 40.5 }, // Mozambique
                    { lat: -26.0, lon: 33.0 }, // Nam Phi
                    { lat: -34.5, lon: 20.0 }, // Mũi Hảo Vọng
                    { lat: -28.0, lon: 15.0 }, // Namibia
                    { lat: -12.0, lon: 13.5 }, // Angola
                    { lat: -4.0, lon: 11.5 },  // Congo
                    { lat: 4.5, lon: 8.5 },    // Vịnh Guinea / Nigeria
                    { lat: 5.0, lon: 0.0 },    // Ghana
                    { lat: 5.0, lon: -7.5 },   // Bờ Biển Ngà
                    { lat: 9.5, lon: -13.5 },  // Guinea
                    { lat: 15.0, lon: -17.5 }, // Dakar (Cực Tây châu Phi)
                    { lat: 23.0, lon: -16.0 }, // Tây Sahara
                    { lat: 32.0, lon: -9.5 },  // Ma-rốc
                    { lat: 35.8, lon: -5.5 }   // Eo Gibraltar
                ]
            },
            {
                name: "Madagascar Island",
                shelfColor: "#7dd3fc",
                landColor: "#059669",
                points: [
                    { lat: -12.5, lon: 49.5 }, { lat: -17.0, lon: 50.0 }, { lat: -25.0, lon: 47.0 },
                    { lat: -25.0, lon: 44.0 }, { lat: -16.0, lon: 44.5 }
                ]
            },

            // 9. BẮC MỸ (Alaska, Canada, Bờ Tây California, Vịnh Mexico, Florida, Bờ Đông)
            {
                name: "North America",
                shelfColor: "#38bdf8",
                landColor: "#059669",
                points: [
                    { lat: 71.0, lon: -156.0 }, // Cực bắc Alaska
                    { lat: 65.0, lon: -168.0 }, // Bán đảo Seward
                    { lat: 59.0, lon: -158.0 }, // Vịnh Bristol
                    { lat: 57.0, lon: -135.0 }, // Đông Nam Alaska
                    { lat: 50.0, lon: -128.0 }, // Đảo Vancouver
                    { lat: 42.0, lon: -124.0 }, // Oregon
                    { lat: 34.0, lon: -119.0 }, // California
                    { lat: 24.0, lon: -110.0 }, // Bán đảo Baja California
                    { lat: 18.0, lon: -105.0 }, // Bờ Tây Mexico
                    { lat: 15.0, lon: -93.0 },  // Nam Mexico
                    { lat: 18.5, lon: -90.0 },  // Bán đảo Yucatan
                    { lat: 26.0, lon: -97.0 },  // Texas / Vịnh Mexico
                    { lat: 30.0, lon: -89.0 },  // New Orleans
                    { lat: 25.5, lon: -80.5 },  // Bán đảo Florida
                    { lat: 33.0, lon: -79.0 },  // Carolina
                    { lat: 41.0, lon: -72.0 },  // New York / Boston
                    { lat: 45.0, lon: -65.0 },  // Nova Scotia
                    { lat: 53.0, lon: -56.0 },  // Bán đảo Labrador
                    { lat: 62.0, lon: -75.0 },  // Vịnh Hudson
                    { lat: 70.0, lon: -120.0 }  // Bắc Cực Canada
                ]
            },

            // 10. TRUNG MỸ & NAM MỸ (Amazon, Dải Chile Andes, Mũi Horn, Brazil)
            {
                name: "South America",
                shelfColor: "#38bdf8",
                landColor: "#047857",
                points: [
                    { lat: 11.5, lon: -74.5 },  // Colombia / Caribe
                    { lat: 10.5, lon: -63.0 },  // Venezuela
                    { lat: 6.0, lon: -53.0 },   // Guyane
                    { lat: 0.0, lon: -50.0 },   // Cửa sông Amazon
                    { lat: -5.0, lon: -35.0 },  // Mũi São Roque (Cực Đông Brazil)
                    { lat: -13.0, lon: -38.5 }, // Salvador
                    { lat: -23.0, lon: -43.0 }, // Rio de Janeiro
                    { lat: -33.0, lon: -52.0 }, // Nam Brazil
                    { lat: -38.0, lon: -58.0 }, // Buenos Aires
                    { lat: -48.0, lon: -66.0 }, // Patagonia
                    { lat: -54.5, lon: -68.0 }, // Tierra del Fuego / Mũi Horn
                    { lat: -50.0, lon: -75.0 }, // Miền Nam Chile
                    { lat: -33.0, lon: -72.0 }, // Santiago
                    { lat: -18.0, lon: -71.0 }, // Bờ biển Peru
                    { lat: -5.0, lon: -81.0 },  // Mũi Pariñas (Cực Tây Nam Mỹ)
                    { lat: 1.0, lon: -80.0 },   // Ecuador
                    { lat: 7.5, lon: -77.5 }    // Eo Panama
                ]
            },

            // 11. CHÂU ÚC (Australia & Tasmania)
            {
                name: "Australia Continent",
                shelfColor: "#38bdf8",
                landColor: "#15803d",
                points: [
                    { lat: -11.0, lon: 142.5 }, // Bán đảo Cape York
                    { lat: -18.0, lon: 146.5 }, // Great Barrier Reef
                    { lat: -27.5, lon: 153.5 }, // Brisbane
                    { lat: -34.0, lon: 151.0 }, // Sydney
                    { lat: -38.5, lon: 146.0 }, // Melbourne
                    { lat: -35.0, lon: 136.0 }, // Adelaide
                    { lat: -32.0, lon: 128.0 }, // Vịnh Đại Úc
                    { lat: -34.5, lon: 118.0 }, // Albany
                    { lat: -31.5, lon: 115.5 }, // Perth
                    { lat: -22.0, lon: 114.0 }, // Tây Bắc Úc
                    { lat: -15.0, lon: 124.0 }, // Kimberley
                    { lat: -12.5, lon: 131.0 }, // Darwin
                    { lat: -16.0, lon: 136.0 }  // Vịnh Carpentaria
                ]
            },

            // 12. BĂNG TUYẾT NAM CỰC (Antarctica Ice Sheet)
            {
                name: "Antarctica Ice Sheet",
                shelfColor: "#a5f3fc",
                landColor: "#e2e8f0",
                points: [
                    { lat: -66.0, lon: -60.0 }, { lat: -72.0, lon: -10.0 }, { lat: -68.0, lon: 40.0 },
                    { lat: -66.0, lon: 90.0 }, { lat: -67.0, lon: 140.0 }, { lat: -72.0, lon: 170.0 },
                    { lat: -78.0, lon: -160.0 }, { lat: -72.0, lon: -100.0 }
                ]
            }
        ];
    }

    // Các dãy núi cao phủ tuyết trắng thật theo tọa độ địa chất
    generateMountainRanges() {
        return [
            // Dãy Himalaya & Cao nguyên Tây Tạng
            {
                name: "Himalaya Range",
                points: [
                    { lat: 28.5, lon: 77.0 }, { lat: 31.0, lon: 81.0 }, { lat: 30.0, lon: 86.0 },
                    { lat: 28.0, lon: 89.0 }, { lat: 28.5, lon: 94.0 }, { lat: 32.5, lon: 93.0 },
                    { lat: 34.0, lon: 85.0 }, { lat: 33.0, lon: 78.0 }
                ]
            },
            // Dãy Andes dọc bờ Tây Nam Mỹ
            {
                name: "Andes Mountain Range",
                points: [
                    { lat: -5.0, lon: -78.0 }, { lat: -15.0, lon: -73.0 }, { lat: -25.0, lon: -69.0 },
                    { lat: -36.0, lon: -71.0 }, { lat: -45.0, lon: -73.0 }, { lat: -44.0, lon: -70.5 },
                    { lat: -34.0, lon: -68.5 }, { lat: -22.0, lon: -66.5 }, { lat: -12.0, lon: -71.0 }
                ]
            },
            // Dãy Alps Châu Âu
            {
                name: "Alps Range",
                points: [
                    { lat: 45.5, lon: 6.5 }, { lat: 46.8, lon: 8.5 }, { lat: 47.5, lon: 11.5 },
                    { lat: 47.0, lon: 13.5 }, { lat: 46.0, lon: 12.0 }, { lat: 45.0, lon: 8.0 }
                ]
            }
        ];
    }

    // Các dải mây khí quyển tự nhiên uốn lượn theo vĩ độ địa cầu
    generateAtmosphericClouds() {
        return [
            // Vành đai mây Xích đạo Đông Nam Á - Thái Bình Dương
            {
                points: [
                    { lat: 4.0, lon: 85.0 }, { lat: 7.0, lon: 105.0 }, { lat: 5.0, lon: 125.0 },
                    { lat: 8.0, lon: 145.0 }, { lat: 3.0, lon: 155.0 }, { lat: -1.0, lon: 135.0 },
                    { lat: 0.0, lon: 110.0 }, { lat: 1.0, lon: 90.0 }
                ]
            },
            // Dải mây ôn đới Bắc Mỹ - Đại Tây Dương
            {
                points: [
                    { lat: 48.0, lon: -130.0 }, { lat: 52.0, lon: -105.0 }, { lat: 49.0, lon: -80.0 },
                    { lat: 44.0, lon: -60.0 }, { lat: 40.0, lon: -70.0 }, { lat: 45.0, lon: -100.0 },
                    { lat: 43.0, lon: -125.0 }
                ]
            },
            // Dải mây xoáy Nam Bán Cầu (Gió Tây Ôn Đới)
            {
                points: [
                    { lat: -42.0, lon: 40.0 }, { lat: -45.0, lon: 80.0 }, { lat: -40.0, lon: 120.0 },
                    { lat: -46.0, lon: 150.0 }, { lat: -50.0, lon: 130.0 }, { lat: -47.0, lon: 90.0 },
                    { lat: -49.0, lon: 50.0 }
                ]
            }
        ];
    }

    // Chia nhỏ cạnh bờ biển theo độ cầu để khi xoay 3D đường bờ biển uốn cong tự nhiên theo mặt cầu
    subdividePolygonPoints(points, maxStepDeg = 4.0) {
        if (!points || points.length < 3) return points;
        const out = [];
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            out.push(p1);

            const dLat = p2.lat - p1.lat;
            let dLon = p2.lon - p1.lon;
            if (dLon > 180) dLon -= 360;
            if (dLon < -180) dLon += 360;

            const dist = Math.hypot(dLat, dLon);
            if (dist > maxStepDeg) {
                const steps = Math.ceil(dist / maxStepDeg);
                for (let k = 1; k < steps; k++) {
                    const t = k / steps;
                    let interLon = p1.lon + t * dLon;
                    if (interLon > 180) interLon -= 360;
                    if (interLon < -180) interLon += 360;
                    out.push({
                        lat: p1.lat + t * dLat,
                        lon: interLon
                    });
                }
            }
        }
        return out;
    }

    subdivideAllGeometries() {
        if (this.continents) {
            this.continents.forEach(cont => {
                cont.points = this.subdividePolygonPoints(cont.points, 4.0);
            });
        }
        if (this.mountainRanges) {
            this.mountainRanges.forEach(mnt => {
                mnt.points = this.subdividePolygonPoints(mnt.points, 3.5);
            });
        }
        if (this.atmosphericClouds) {
            this.atmosphericClouds.forEach(cld => {
                cld.points = this.subdividePolygonPoints(cld.points, 5.0);
            });
        }
    }

    // Sinh 30 mảnh vụn thiên thạch nhỏ li ti trôi bồng bềnh ngẫu nhiên không pattern
    generateOrganicFloatingAsteroids() {
        const asteroids = [];
        const count = 30;
        for (let i = 0; i < count; i++) {
            const size = 3.5 + Math.random() * 6.5; // Kích thước nhỏ 3.5px -> 10px
            const pts = 4 + Math.floor(Math.random() * 3); // 4-6 cạnh
            const angle = Math.random() * Math.PI * 2;
            const rotSpeed = (Math.random() - 0.5) * 0.016;
            // Vận tốc trôi chậm rãi
            const vx = (Math.random() - 0.5) * 0.22;
            const vy = (Math.random() - 0.5) * 0.18;
            const alpha = 0.40 + Math.random() * 0.45;

            const xRatio = Math.random();
            const yRatio = Math.random();

            asteroids.push({
                xRatio,
                yRatio,
                x: 0,
                y: 0,
                initialized: false,
                size,
                pts,
                angle,
                rotSpeed,
                vx,
                vy,
                alpha
            });
        }
        return asteroids;
    }

    spawnRandomObservationSite() {
        const uncaptured = this.anomalies.filter(a => !a.captured);
        if (uncaptured.length === 0) return;

        // Nếu còn 4 điểm trở xuống -> Luôn duy trì TẤT CẢ các điểm còn lại active = true để học sinh dễ chụp
        if (uncaptured.length <= 4) {
            uncaptured.forEach(a => {
                a.active = true;
            });
            return;
        }

        // Đảm bảo luôn có từ 4 đến 5 điểm active cùng lúc
        const activeCount = uncaptured.filter(a => a.active).length;
        if (activeCount < 4) {
            const inactive = uncaptured.filter(a => !a.active);
            if (inactive.length > 0) {
                const pick = inactive[Math.floor(Math.random() * inactive.length)];
                pick.active = true;
                pick.pingTime = 0;

                setTimeout(() => {
                    if (pick.active && !pick.captured && this.anomalies.filter(a => !a.captured).length > 4) {
                        pick.active = false;
                    }
                }, 14000);
            }
        }
    }

    // Chuyển đổi tọa độ lat, lon sang vector 3D trên mặt cầu đơn vị theo góc quay hiện tại
    getUnitVector3D(latDeg, lonDeg) {
        const lat = (latDeg * Math.PI) / 180;
        const lon = ((lonDeg + this.rotation * (180 / Math.PI)) * Math.PI) / 180;
        const cosLat = Math.cos(lat);
        return {
            x: cosLat * Math.sin(lon),
            y: -Math.sin(lat),
            z: cosLat * Math.cos(lon)
        };
    }

    // Cắt đa giác với mặt phẳng chân trời Z >= 0
    // Tự động chèn cung tròn chân trời ôm khít độ cong Trái Đất, loại bỏ triệt để hiện tượng gãy hình / cắt cụt khi qua mép!
    clipPolygonToHorizon(points3D) {
        if (!points3D || points3D.length < 3) return [];
        const out = [];
        const n = points3D.length;

        let lastExitPoint = null;
        let behindPoints = [];

        for (let i = 0; i < n; i++) {
            const curr = points3D[i];
            const prev = points3D[(i + n - 1) % n];

            const currVisible = curr.z >= 0;
            const prevVisible = prev.z >= 0;

            if (currVisible) {
                if (!prevVisible) {
                    // Cắt từ mặt sau ra mặt trước tại Z = 0 (Enter)
                    const t = (0 - prev.z) / (curr.z - prev.z);
                    const ix = prev.x + t * (curr.x - prev.x);
                    const iy = prev.y + t * (curr.y - prev.y);
                    const len = Math.hypot(ix, iy) || 1;
                    const enterPt = { x: ix / len, y: iy / len, z: 0 };

                    // Nếu trước đó có điểm exit, chèn cung tròn chân trời ôm theo viền cong Trái Đất
                    if (lastExitPoint) {
                        this.insertHorizonArc(out, lastExitPoint, enterPt, behindPoints);
                        lastExitPoint = null;
                        behindPoints = [];
                    }
                    out.push(enterPt);
                }
                out.push(curr);
            } else {
                behindPoints.push(curr);
                if (prevVisible) {
                    // Cắt từ mặt trước ra mặt sau tại Z = 0 (Exit)
                    const t = (0 - prev.z) / (curr.z - prev.z);
                    const ix = prev.x + t * (curr.x - prev.x);
                    const iy = prev.y + t * (curr.y - prev.y);
                    const len = Math.hypot(ix, iy) || 1;
                    lastExitPoint = { x: ix / len, y: iy / len, z: 0 };
                    out.push(lastExitPoint);
                }
            }
        }

        // Trường hợp chu kỳ khép kín: Điểm thoát ở cuối mảng và điểm vào ở đầu mảng
        if (lastExitPoint && out.length > 0) {
            const firstEnter = out.find(p => Math.abs(p.z) < 1e-4 && p !== lastExitPoint);
            if (firstEnter) {
                this.insertHorizonArc(out, lastExitPoint, firstEnter, behindPoints);
            }
        }

        return out;
    }

    // Chèn chuỗi điểm bám sát cung tròn chân trời của Trái Đất (Horizon Arc) giữa 2 điểm cắt
    insertHorizonArc(outArray, exitPt, enterPt, behindPoints) {
        const thetaExit = Math.atan2(exitPt.y, exitPt.x);
        const thetaEnter = Math.atan2(enterPt.y, enterPt.x);

        let dTheta = thetaEnter - thetaExit;
        while (dTheta > Math.PI) dTheta -= Math.PI * 2;
        while (dTheta < -Math.PI) dTheta += Math.PI * 2;

        if (behindPoints && behindPoints.length > 0) {
            let avgX = 0, avgY = 0;
            behindPoints.forEach(p => { avgX += p.x; avgY += p.y; });
            const thetaBehind = Math.atan2(avgY, avgX);

            const mid1 = thetaExit + dTheta * 0.5;
            const revDTheta = dTheta > 0 ? dTheta - Math.PI * 2 : dTheta + Math.PI * 2;
            const mid2 = thetaExit + revDTheta * 0.5;

            const diff1 = Math.abs(Math.atan2(Math.sin(mid1 - thetaBehind), Math.cos(mid1 - thetaBehind)));
            const diff2 = Math.abs(Math.atan2(Math.sin(mid2 - thetaBehind), Math.cos(mid2 - thetaBehind)));

            if (diff2 < diff1) {
                dTheta = revDTheta;
            }
        }

        const steps = Math.max(2, Math.min(20, Math.ceil(Math.abs(dTheta) / 0.08)));
        for (let k = 1; k < steps; k++) {
            const th = thetaExit + (k / steps) * dTheta;
            outArray.push({
                x: Math.cos(th),
                y: Math.sin(th),
                z: 0
            });
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Cập nhật góc quay Trái Đất & Quỹ đạo vệ tinh 3D
        this.rotation += this.rotationSpeed;
        this.orbitTime += 0.015;

        // Quỹ đạo Elip 3D quanh tâm quả cầu
        const orbitRx = this.globeRadius * 1.36;
        const orbitRz = this.globeRadius * 1.25;
        const orbitTilt = 0.38;

        const rawX = Math.cos(this.orbitTime) * orbitRx;
        const rawZ = Math.sin(this.orbitTime) * orbitRz;
        const rawY = rawZ * Math.sin(orbitTilt) * 0.6 - Math.cos(this.orbitTime) * (this.globeRadius * 0.22);

        this.satX = this.globeCenterX + rawX;
        this.satY = this.globeCenterY + rawY - this.globeRadius * 0.18;
        this.satZ = rawZ;

        // Cập nhật trước tọa độ 3D và màn hình của tất cả các trinh sát viễn thám
        this.anomalies.forEach(ano => {
            if (ano.captured) {
                ano.visible = false;
                return;
            }
            const u = this.getUnitVector3D(ano.lat, ano.lon);
            ano.z3D = u.z;
            ano.screenX = this.globeCenterX + u.x * this.globeRadius;
            ano.screenY = this.globeCenterY + u.y * this.globeRadius;
            ano.visible = (u.z > 0.05);
        });

        // Nếu còn ít hơn hoặc bằng 3 điểm, đảm bảo các điểm còn lại luôn active
        const uncapturedAnos = this.anomalies.filter(a => !a.captured);
        if (uncapturedAnos.length <= 3) {
            uncapturedAnos.forEach(a => { a.active = true; });
        }

        // THUẬT TOÁN ĐIỀU HƯỚNG RADAR THÔNG MINH (TARGET-SEEKING RADAR):
        // Ưu tiên tự động lượn đến các điểm chưa chụp đang ở mặt trước Trái Đất (đặc biệt các điểm ở cực Bắc/Nam)
        const frontCandidates = this.anomalies.filter(a => !a.captured && a.active && a.visible && a.z3D > 0.08);

        // Kiểm tra tính hợp lệ của mục tiêu hiện tại
        if (this.targetSeekAno) {
            if (this.targetSeekAno.captured || !this.targetSeekAno.visible || !this.targetSeekAno.active || this.targetSeekAno.z3D <= 0.05) {
                this.targetSeekAno = null;
                this.seekDwellTimer = 0;
            }
        }

        // Nếu chưa có mục tiêu và có ứng viên -> Chọn mục tiêu gần chùm tia nhất
        if (!this.targetSeekAno && frontCandidates.length > 0) {
            frontCandidates.sort((a, b) => {
                const da = Math.hypot(a.screenX - this.scanBeamX, a.screenY - this.scanBeamY);
                const db = Math.hypot(b.screenX - this.scanBeamX, b.screenY - this.scanBeamY);
                return da - db;
            });
            this.targetSeekAno = frontCandidates[0];
            this.seekDwellTimer = 0;
        }

        const sweepT = this.orbitTime * 0.95;

        if (this.targetSeekAno) {
            const destX = this.targetSeekAno.screenX;
            const destY = this.targetSeekAno.screenY;

            // Kiểm tra xem mục tiêu đã lọt vào vòng reticle chưa
            const inReticle = this.isAnomalyInReticle(this.targetSeekAno);
            if (inReticle) {
                this.seekDwellTimer++;
                // Dừng lại và bám chặt mục tiêu để học sinh thoải mái click chụp (khoảng 3.5 giây)
                this.scanBeamX += (destX - this.scanBeamX) * 0.15;
                this.scanBeamY += (destY - this.scanBeamY) * 0.15;

                // Nếu sau 3.5 giây học sinh chưa chụp mà có điểm khác đang chờ -> Chuyển tạm sang điểm khác
                if (this.seekDwellTimer > 210 && frontCandidates.length > 1) {
                    this.targetSeekAno = frontCandidates.find(c => c !== this.targetSeekAno) || this.targetSeekAno;
                    this.seekDwellTimer = 0;
                }
            } else {
                // Di chuyển mượt mà về phía mục tiêu với tốc độ ổn định
                const distToDest = Math.hypot(destX - this.scanBeamX, destY - this.scanBeamY);
                const moveSpeed = Math.min(0.060, Math.max(0.025, 0.040 * (distToDest / 100)));
                this.scanBeamX += (destX - this.scanBeamX) * moveSpeed;
                this.scanBeamY += (destY - this.scanBeamY) * moveSpeed;
            }
        } else {
            // Chế độ tuần tra quét rộng (Patrol Mode) bao quát toàn cầu từ Bắc chí Nam khi không có điểm nào mặt trước
            const patrolX = this.globeCenterX + Math.sin(sweepT) * (this.globeRadius * 0.72);
            const patrolY = this.globeCenterY + Math.sin(sweepT * 1.35 + 0.5) * (this.globeRadius * 0.78);
            this.scanBeamX += (patrolX - this.scanBeamX) * 0.035;
            this.scanBeamY += (patrolY - this.scanBeamY) * 0.035;
        }

        // Đảm bảo tâm chùm quét luôn nằm trong phạm vi mặt cầu
        const dCenterDist = Math.hypot(this.scanBeamX - this.globeCenterX, this.scanBeamY - this.globeCenterY);
        const maxR = this.globeRadius * 0.90;
        if (dCenterDist > maxR) {
            this.scanBeamX = this.globeCenterX + ((this.scanBeamX - this.globeCenterX) / dCenterDist) * maxR;
            this.scanBeamY = this.globeCenterY + ((this.scanBeamY - this.globeCenterY) / dCenterDist) * maxR;
        }

        const groundScanX = this.scanBeamX;
        const groundScanY = this.scanBeamY;

        this.targetReticle.x = groundScanX;
        this.targetReticle.y = groundScanY;
        this.targetReticle.rx = 64;
        this.targetReticle.ry = 38;
        this.targetReticle.angle = (Math.sin(sweepT * 0.8) * 12 * Math.PI) / 180;
        this.targetReticle.active = this.satZ > -25;

        // Tự động kiểm tra xem có tọa độ nào lọt TRỌN vào vòng tròn quét không (LOCK-ON)
        const lockedAno = this.anomalies.find(ano => ano.active && !ano.captured && ano.visible && this.isAnomalyInReticle(ano));
        this.targetReticle.locked = !!lockedAno;
        this.targetReticle.lockedTarget = lockedAno || null;

        // 2. VẼ BẦU TRỜI SAO LI TI
        this.drawSpaceStars();

        // 3. VẼ TIỂU HÀNH TINH ĐÁ NỔI KHỐI BÊN PHẢI (Google AI Quest Style)
        this.drawAsteroids();

        // 4. NẾU VỆ TINH Ở PHÍA SAU TRÁI ĐẤT (Z < 0) -> VẼ VỆ TINH TRƯỚC (BỊ CHE KHUẤT TỰ NHIÊN)
        if (this.satZ < 0) {
            this.draw3DSatellite(false);
        }

        // 5. VẼ QUẢ ĐỊA CẦU CEL-SHADED TOON 3D
        this.drawCelShadedGlobe(groundScanX, groundScanY);

        // 6. NẾU VỆ TINH Ở PHÍA TRƯỚC TRÁI ĐẤT (Z >= 0) -> VẼ VỆ TINH & CHÙM QUÉT MỞ RỘNG
        if (this.satZ >= 0) {
            this.drawSatelliteScanBeam(groundScanX, groundScanY);
            this.draw3DSatellite(true);
        }

        requestAnimationFrame(this.render);
    }

    drawSpaceStars() {
        this.spaceStars.forEach(s => {
            s.alpha += Math.sin(this.orbitTime * 2 + s.xRatio * 10) * 0.01;
            const a = Math.max(0.15, Math.min(0.9, s.alpha));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
            this.ctx.beginPath();
            this.ctx.arc(s.xRatio * this.width, s.yRatio * this.height, s.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawAsteroids() {
        this.asteroids.forEach(ast => {
            // Khởi tạo tọa độ pixel ban đầu theo kích thước canvas
            if (!ast.initialized) {
                ast.x = ast.xRatio * this.width;
                ast.y = ast.yRatio * this.height;
                ast.initialized = true;
            }

            // Trôi chậm rãi tự do & tự xoay
            ast.x += ast.vx;
            ast.y += ast.vy;
            ast.angle += ast.rotSpeed;

            // Wrap quanh khung nhìn khi trôi ra ngoài biên
            if (ast.x < -30) ast.x = this.width + 30;
            if (ast.x > this.width + 30) ast.x = -30;
            if (ast.y < -30) ast.y = this.height + 30;
            if (ast.y > this.height + 30) ast.y = -30;

            // Không bao giờ vẽ đè lên địa cầu (giữ khoảng cách an toàn với bầu khí quyển)
            const distToEarth = Math.hypot(ast.x - this.globeCenterX, ast.y - this.globeCenterY);
            if (distToEarth < this.globeRadius * 1.10) return;

            this.ctx.save();
            this.ctx.translate(ast.x, ast.y);
            this.ctx.rotate(ast.angle);
            this.ctx.globalAlpha = ast.alpha;

            // 1. Thân mảnh vụn góc cạnh nhỏ nhắn
            this.ctx.beginPath();
            for (let i = 0; i < ast.pts; i++) {
                const a = (i / ast.pts) * Math.PI * 2;
                const r = (ast.size * 0.5) * (0.8 + Math.sin(i * 2.3 + ast.pts) * 0.25);
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();

            this.ctx.fillStyle = '#64748b';
            this.ctx.fill();
            this.ctx.strokeStyle = '#0f172a';
            this.ctx.lineWidth = 1.2;
            this.ctx.stroke();

            // 2. Vạt sáng nhỏ cel-shade (nếu kích thước > 5px)
            if (ast.size > 5) {
                this.ctx.fillStyle = '#94a3b8';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(ast.size * 0.32, -ast.size * 0.18);
                this.ctx.lineTo(ast.size * 0.14, -ast.size * 0.32);
                this.ctx.closePath();
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    drawCelShadedGlobe(groundScanX, groundScanY) {
        this.ctx.save();

        // Viền hào quang khí quyển mềm nhẹ bên ngoài
        const atmGrad = this.ctx.createRadialGradient(
            this.globeCenterX, this.globeCenterY, this.globeRadius * 0.96,
            this.globeCenterX, this.globeCenterY, this.globeRadius * 1.08
        );
        atmGrad.addColorStop(0, 'rgba(125, 211, 252, 0.4)');
        atmGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
        this.ctx.beginPath();
        this.ctx.arc(this.globeCenterX, this.globeCenterY, this.globeRadius * 1.08, 0, Math.PI * 2);
        this.ctx.fillStyle = atmGrad;
        this.ctx.fill();

        // Cắt mặt phẳng quả cầu
        this.ctx.beginPath();
        this.ctx.arc(this.globeCenterX, this.globeCenterY, this.globeRadius, 0, Math.PI * 2);
        this.ctx.clip();

        // 1. NỀN NƯỚC BIỂN ĐẠI DƯƠNG CEL-SHADED
        const seaGrad = this.ctx.createRadialGradient(
            this.globeCenterX - this.globeRadius * 0.32,
            this.globeCenterY - this.globeRadius * 0.32,
            this.globeRadius * 0.1,
            this.globeCenterX, this.globeCenterY, this.globeRadius * 1.02
        );
        seaGrad.addColorStop(0, '#60a5fa');
        seaGrad.addColorStop(0.65, '#3b82f6');
        seaGrad.addColorStop(1, '#1d4ed8');

        this.ctx.fillStyle = seaGrad;
        this.ctx.fill();

        // 2. VẼ ĐỊA TẦNG ĐA LỚP CÓ HORIZON CLIPPING
        this.continents.forEach(cont => {
            // Chuyển toàn bộ đỉnh sang vector 3D
            const points3D = cont.points.map(pt => this.getUnitVector3D(pt.lat, pt.lon));

            // Tầng 1: Thềm lục địa ngọc lam bao quanh đường bờ biển
            this.renderClippedContinent(points3D, 1.004, cont.shelfColor, null, 0);

            // Tầng 2: Thân lục địa đất rừng xanh có viền mực đen
            this.renderClippedContinent(points3D, 0.998, cont.landColor, '#0f172a', 1.8);
        });

        // 3. VẼ CÁC DÃY NÚI CAO TUYẾT TRẮNG THẬT (Himalaya, Andes, Alps)
        if (this.mountainRanges) {
            this.mountainRanges.forEach(mnt => {
                const points3D = mnt.points.map(pt => this.getUnitVector3D(pt.lat, pt.lon));
                this.renderClippedMountain(points3D);
            });
        }

        // 4. VẼ DẢI MÂY KHÍ QUYỂN BỒNG BỀNH (Atmospheric Cloud Belts)
        if (this.atmosphericClouds) {
            this.atmosphericClouds.forEach(cld => {
                const cloudLonOffset = Math.sin(this.orbitTime * 0.25) * 2.5;
                const points3D = cld.points.map(pt => this.getUnitVector3D(pt.lat, pt.lon + cloudLonOffset));
                this.renderClippedCloud(points3D);
            });
        }

        // 5. VẼ CÁC TỌA ĐỘ QUAN SÁT
        this.drawObservationSites();

        this.ctx.restore(); // Hết clip quả cầu

        // 6. ĐƯỜNG VIỀN MỰC ĐEN NGOÀI CÙNG CỦA HÀNH TINH
        this.ctx.beginPath();
        this.ctx.arc(this.globeCenterX, this.globeCenterY, this.globeRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 3.5;
        this.ctx.stroke();
    }

    // Render đa giác lục địa đã cắt chân trời, bảo đảm mượt mà không bao giờ bị méo mó hay vắt chéo
    renderClippedContinent(points3D, radiusFactor, fillColor, strokeColor, strokeWidth) {
        const clipped = this.clipPolygonToHorizon(points3D);
        if (!clipped || clipped.length < 3) return;

        const R = this.globeRadius * radiusFactor;
        this.ctx.beginPath();
        clipped.forEach((p, idx) => {
            const sx = this.globeCenterX + p.x * R;
            const sy = this.globeCenterY + p.y * R;
            if (idx === 0) this.ctx.moveTo(sx, sy);
            else this.ctx.lineTo(sx, sy);
        });
        this.ctx.closePath();

        this.ctx.fillStyle = fillColor;
        this.ctx.fill();

        if (strokeColor && strokeWidth > 0) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke();
        }
    }

    // Render dãy núi cao phủ tuyết trắng và bóng sườn núi cel-shaded
    renderClippedMountain(points3D) {
        const clipped = this.clipPolygonToHorizon(points3D);
        if (!clipped || clipped.length < 3) return;

        const R = this.globeRadius * 1.002;
        this.ctx.save();

        // 1. Bóng sườn núi
        this.ctx.beginPath();
        clipped.forEach((p, idx) => {
            const sx = this.globeCenterX + p.x * R + 2;
            const sy = this.globeCenterY + p.y * R + 2.5;
            if (idx === 0) this.ctx.moveTo(sx, sy);
            else this.ctx.lineTo(sx, sy);
        });
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        this.ctx.fill();

        // 2. Đỉnh tuyết trắng nổi khối
        this.ctx.beginPath();
        clipped.forEach((p, idx) => {
            const sx = this.globeCenterX + p.x * R;
            const sy = this.globeCenterY + p.y * R;
            if (idx === 0) this.ctx.moveTo(sx, sy);
            else this.ctx.lineTo(sx, sy);
        });
        this.ctx.closePath();
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fill();
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 1.6;
        this.ctx.stroke();

        this.ctx.restore();
    }

    // Render dải mây khí quyển mềm mại bồng bềnh có bóng đổ xuống địa cầu
    renderClippedCloud(points3D) {
        const clipped = this.clipPolygonToHorizon(points3D);
        if (!clipped || clipped.length < 3) return;

        const R = this.globeRadius * 1.006;
        this.ctx.save();

        // 1. Bóng mây hắt nhẹ xuống mặt đất
        this.ctx.beginPath();
        clipped.forEach((p, idx) => {
            const sx = this.globeCenterX + p.x * (this.globeRadius * 0.998) + 4;
            const sy = this.globeCenterY + p.y * (this.globeRadius * 0.998) + 4;
            if (idx === 0) this.ctx.moveTo(sx, sy);
            else this.ctx.lineTo(sx, sy);
        });
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
        this.ctx.fill();

        // 2. Mây bồng bềnh màu trắng sữa
        this.ctx.beginPath();
        clipped.forEach((p, idx) => {
            const sx = this.globeCenterX + p.x * R;
            const sy = this.globeCenterY + p.y * R;
            if (idx === 0) this.ctx.moveTo(sx, sy);
            else this.ctx.lineTo(sx, sy);
        });
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(241, 245, 249, 0.9)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawObservationSites() {
        this.anomalies.forEach(ano => {
            if (ano.captured) return;
            const u = this.getUnitVector3D(ano.lat, ano.lon);
            const visible = u.z > 0.05; // Chỉ vẽ khi quay về mặt trước

            ano.screenX = this.globeCenterX + u.x * this.globeRadius;
            ano.screenY = this.globeCenterY + u.y * this.globeRadius;
            ano.visible = visible;

            if (visible && ano.active) {
                ano.pingTime += 0.05;
                const pulse = (Math.sin(ano.pingTime * 4) + 1) * 0.5;

                // Vòng sóng radar tròn phát tín hiệu cel-shaded
                this.ctx.beginPath();
                this.ctx.arc(ano.screenX, ano.screenY, 10 + pulse * 18, 0, Math.PI * 2);
                this.ctx.strokeStyle = ano.color;
                this.ctx.lineWidth = 2.2;
                this.ctx.stroke();

                // Đốm tín hiệu Toon có viền đen
                this.ctx.beginPath();
                this.ctx.arc(ano.screenX, ano.screenY, 6.5, 0, Math.PI * 2);
                this.ctx.fillStyle = ano.color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#0f172a';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // Tag nhãn thông tin khoa học
                this.ctx.save();
                this.ctx.fillStyle = '#0f172a';
                this.ctx.fillRect(ano.screenX + 10, ano.screenY - 12, ano.label.length * 6.5 + 8, 16);
                this.ctx.strokeStyle = ano.color;
                this.ctx.lineWidth = 1.2;
                this.ctx.strokeRect(ano.screenX + 10, ano.screenY - 12, ano.label.length * 6.5 + 8, 16);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 9px monospace';
                this.ctx.fillText(ano.label, ano.screenX + 14, ano.screenY);
                this.ctx.restore();
            }
        });
    }

    // Kiểm tra xem một tọa độ viễn thám có nằm TRỌN bên trong vòng elip quét hay không
    isAnomalyInReticle(ano) {
        if (!this.targetReticle.active || !ano.visible) return false;
        const rx = this.targetReticle.rx || 64;
        const ry = this.targetReticle.ry || 38;
        const angle = this.targetReticle.angle || 0;

        const dx = ano.screenX - this.targetReticle.x;
        const dy = ano.screenY - this.targetReticle.y;
        const cosA = Math.cos(-angle);
        const sinA = Math.sin(-angle);
        const lx = dx * cosA - dy * sinA;
        const ly = dx * sinA + dy * cosA;

        // Bắt buộc nằm trong hình elip (kèm dung sai tối đa 1.05, loại bỏ hoàn toàn vùng rìa ngoài)
        return ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry)) <= 1.05;
    }

    // Chùm nón quét Laser từ bụng Vệ tinh xuống mặt đất (Mượt mà, đáy cong elip, có radar quét 360 độ và Lock-on)
    drawSatelliteScanBeam(groundScanX, groundScanY) {
        if (!this.targetReticle.active) return;

        const rx = this.targetReticle.rx || 64;
        const ry = this.targetReticle.ry || 38;
        const angle = this.targetReticle.angle || 0;
        const isLocked = this.targetReticle.locked;
        const beamColor = isLocked ? '#00e676' : '#00e5ff';
        const beamRgba = isLocked ? '0, 230, 118' : '0, 229, 255';

        this.ctx.save();

        // 1. Chùm nón ánh sáng volumetric chiếu từ vệ tinh xuống vành elip đáy cong
        const beamGrad = this.ctx.createLinearGradient(this.satX, this.satY, groundScanX, groundScanY);
        beamGrad.addColorStop(0, `rgba(${beamRgba}, 0.75)`);
        beamGrad.addColorStop(0.5, `rgba(${beamRgba}, 0.12)`);
        beamGrad.addColorStop(1, `rgba(${beamRgba}, 0.45)`);

        this.ctx.beginPath();
        this.ctx.moveTo(this.satX, this.satY);

        const pLeftX = groundScanX - rx * Math.cos(angle);
        const pLeftY = groundScanY - rx * Math.sin(angle);
        this.ctx.lineTo(pLeftX, pLeftY);

        // Đáy chùm nón uốn cong theo nửa dưới elip ôm sát bề mặt cầu
        this.ctx.ellipse(groundScanX, groundScanY, rx, ry, angle, Math.PI, 0, false);
        this.ctx.lineTo(this.satX, this.satY);
        this.ctx.closePath();
        this.ctx.fillStyle = beamGrad;
        this.ctx.fill();

        // 2. Vành Elip ngắm bắn tiếp xúc bề mặt địa cầu
        this.ctx.beginPath();
        this.ctx.ellipse(groundScanX, groundScanY, rx, ry, angle, 0, Math.PI * 2);
        this.ctx.strokeStyle = beamColor;
        this.ctx.lineWidth = isLocked ? 3.5 : 2.2;
        this.ctx.shadowColor = beamColor;
        this.ctx.shadowBlur = isLocked ? 16 : 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = isLocked ? 'rgba(0, 230, 118, 0.22)' : 'rgba(0, 229, 255, 0.12)';
        this.ctx.fill();

        // 3. Hiệu ứng quét Radar xoay 360 độ mượt mà bên trong elip
        const radarSweep = (this.orbitTime * 2.8) % (Math.PI * 2);
        this.ctx.save();
        this.ctx.translate(groundScanX, groundScanY);
        this.ctx.rotate(angle);

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, rx * 0.95, radarSweep - 0.45, radarSweep);
        this.ctx.closePath();
        this.ctx.fillStyle = isLocked ? 'rgba(0, 230, 118, 0.35)' : 'rgba(0, 229, 255, 0.20)';
        this.ctx.fill();

        // Tâm ngắm quang học HUD
        this.ctx.strokeStyle = beamColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-16, 0); this.ctx.lineTo(16, 0);
        this.ctx.moveTo(0, -12); this.ctx.lineTo(0, 12);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, isLocked ? 8 : 4.5, 0, Math.PI * 2);
        this.ctx.stroke();

        // Tag trạng thái HUD
        this.ctx.fillStyle = isLocked ? '#00e676' : '#00e5ff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(isLocked ? '[LOCK-ON: SAN SANG CHUP]' : '[RADAR SCANNING]', 0, ry + 16);
        this.ctx.textAlign = 'left';

        this.ctx.restore();
        this.ctx.restore();
    }

    // Vẽ Vệ tinh FireSat 3D Cel-shaded (Đã tách nền trong suốt 100%)
    draw3DSatellite(inFront) {
        this.ctx.save();
        this.ctx.translate(this.satX, this.satY);

        const baseScale = inFront ? 0.95 + (this.satZ / (this.globeRadius * 1.3)) * 0.35 : 0.65;
        this.ctx.scale(baseScale, baseScale);

        const tilt = Math.cos(this.orbitTime) * 0.25;
        this.ctx.rotate(tilt);

        const satDrawable = this.transparentSatCanvas || (this.satImg.complete && this.satImg.naturalWidth > 0 ? this.satImg : null);

        if (satDrawable) {
            const w = 88;
            const h = 88;

            if (inFront) {
                this.ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
                this.ctx.shadowBlur = 18;
                this.ctx.shadowOffsetY = 12;
            }

            this.ctx.drawImage(satDrawable, -w / 2, -h / 2, w, h);
            this.ctx.shadowBlur = 0;
        } else {
            this.drawFallbackToonSatellite();
        }

        this.ctx.restore();
    }

    // Tách sạch 100% vùng nền xanh đen/navy bên ngoài ảnh bằng thuật toán Flood-Fill từ biên
    processSatelliteImage() {
        if (!this.satImg.complete || this.satImg.naturalWidth === 0) return;

        const w = this.satImg.naturalWidth;
        const h = this.satImg.naturalHeight;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = w;
        offCanvas.height = h;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(this.satImg, 0, 0);

        let imgData;
        try {
            imgData = offCtx.getImageData(0, 0, w, h);
        } catch (e) {
            return;
        }

        const data = imgData.data;
        const visited = new Uint8Array(w * h);
        const queue = [];

        // Đẩy 4 cạnh biên vào queue để loang từ ngoài vào
        for (let x = 0; x < w; x++) {
            queue.push(x, 0);
            queue.push(x, h - 1);
            visited[0 * w + x] = 1;
            visited[(h - 1) * w + x] = 1;
        }
        for (let y = 1; y < h - 1; y++) {
            queue.push(0, y);
            queue.push(w - 1, y);
            visited[y * w + 0] = 1;
            visited[y * w + (w - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
            const qx = queue[head++];
            const qy = queue[head++];
            const idx = qy * w + qx;
            const pIdx = idx * 4;

            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];

            const isDarkBackground = (r < 40 && g < 50 && b < 70) || (r + g + b < 130 && b >= r && g >= r);

            if (isDarkBackground) {
                data[pIdx + 3] = 0;

                const neighbors = [
                    [qx + 1, qy],
                    [qx - 1, qy],
                    [qx, qy + 1],
                    [qx, qy - 1]
                ];

                for (let i = 0; i < 4; i++) {
                    const nx = neighbors[i][0];
                    const ny = neighbors[i][1];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const nIdx = ny * w + nx;
                        if (!visited[nIdx]) {
                            visited[nIdx] = 1;
                            queue.push(nx, ny);
                        }
                    }
                }
            }
        }

        offCtx.putImageData(imgData, 0, 0);
        this.transparentSatCanvas = offCanvas;
    }

    drawFallbackToonSatellite() {
        this.ctx.fillStyle = '#2563eb';
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(-45, -14, 30, 28);
        this.ctx.strokeRect(-45, -14, 30, 28);

        this.ctx.fillRect(15, -14, 30, 28);
        this.ctx.strokeRect(15, -14, 30, 28);

        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(-14, -16, 28, 32);
        this.ctx.strokeRect(-14, -16, 28, 32);

        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(0, 16, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Xử lý click chuột chụp mục tiêu: BẮT BUỘC MỤC TIÊU PHẢI NẰM TRỌN TRONG VÒNG TRÒN QUÉT
    handleCanvasClick(clickX, clickY) {
        if (this.satZ < -20) {
            return { success: false, reason: 'behind_earth' };
        }

        const distToReticle = Math.hypot(clickX - this.targetReticle.x, clickY - this.targetReticle.y);
        const clickedReticle = distToReticle <= Math.max(this.targetReticle.rx, this.targetReticle.ry) + 15;

        // Trường hợp 1: Người chơi click thẳng vào vòng tròn quét khi đã Lock-on mục tiêu
        if (clickedReticle && this.targetReticle.locked && this.targetReticle.lockedTarget) {
            const ano = this.targetReticle.lockedTarget;
            ano.captured = true;
            ano.active = false;
            this.targetReticle.locked = false;
            this.targetReticle.lockedTarget = null;
            if (this.onCaptureCallback) {
                this.onCaptureCallback(ano.id);
            }
            return { success: true, id: ano.id, type: ano.type, label: ano.label };
        }

        // Trường hợp 2: Người chơi click vào các điểm tọa độ
        for (let ano of this.anomalies) {
            if (ano.active && !ano.captured && ano.visible) {
                const distToClick = Math.hypot(clickX - ano.screenX, clickY - ano.screenY);
                if (distToClick < 44) {
                    // BẮT BUỘC điểm tọa độ phải nằm TRỌN trong vòng tròn elip quét mới chụp được
                    const inside = this.isAnomalyInReticle(ano);
                    if (inside) {
                        ano.captured = true;
                        ano.active = false;
                        if (this.onCaptureCallback) {
                            this.onCaptureCallback(ano.id);
                        }
                        return { success: true, id: ano.id, type: ano.type, label: ano.label };
                    } else {
                        // Nằm ở rìa ngoài hoặc chưa vào vòng tròn: TUYỆT ĐỐI KHÔNG ĐƯỢC CHỤP!
                        return { success: false, reason: 'outside_reticle' };
                    }
                }
            }
        }

        if (clickedReticle) {
            return { success: false, reason: 'no_target_in_scanner' };
        }

        return null;
    }
}

window.Earth3DGlobe = Earth3DGlobe;
