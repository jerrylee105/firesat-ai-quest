// FireSat AI Quest - Advanced Mission Control Game Logic (16 ảnh viễn thám thực tế)
// Đồng bộ chùm quét vệ tinh, thanh chỉ dẫn 1 dòng trên cùng, cảm biến nhiệt hồng ngoại IR và phân loại 16 ảnh

class FireSatGame {
    constructor() {
        this.currentScreen = 'screen-intro';
        this.collectedPhotos = [];
        this.cleaningIndex = 0;
        this.cleanedCounts = { trash: 0, fire: 0, safe: 0 };

        // Rig vệ tinh bay
        this.rigEl = null;
        this.reticleEl = null;
        this.rigAnimFrame = null;
        this.rigX = 60;
        this.rigDir = 1;
        this.rigSpeed = 2.4;

        // Stage 3: Neural Wiring & Reactor Tuning Parameters
        this.cables = { rgb: false, ir: false, radar: false };
        this.tempThreshold = 50;
        this.selectedEpochs = 5;
        this.lastAccuracy = 99.2;

        // Patrol & Extinguish
        this.patrolTimer = null;
        this.patrolSeconds = 10;
        this.targetLocked = false;
        this.fireInterval = null;

        // Stage Briefing tracking
        this.currentStageNum = 1;
        this.pendingBriefingCallback = null;

        // Stage 2: Tactical Deck & Hologram & Timer & Arcade Combo
        this.selectedDeckPhotoId = null;
        this.classifiedPhotoIds = new Set();
        this.stage2Timer = null;
        this.stage2TimeRemaining = 70;
        this.comboStreak = 1;

        this.particles = new window.ParticleSystem('bg-canvas');
        this.initDOM();
        this.bindEvents();
        this.checkURLRoute();
    }

    initDOM() {
        this.screens = {
            intro: document.getElementById('screen-intro'),
            s1: document.getElementById('screen-1'),
            s2: document.getElementById('screen-2'),
            s3: document.getElementById('screen-3'),
            s4: document.getElementById('screen-4'),
            victory: document.getElementById('screen-victory')
        };

        this.navSteps = [
            document.getElementById('step-nav-1'),
            document.getElementById('step-nav-2'),
            document.getElementById('step-nav-3'),
            document.getElementById('step-nav-4')
        ];

        this.robotMsg = document.getElementById('robot-dialogue-text');
        this.robotEyeL = document.getElementById('robot-eye-left');
        this.robotEyeR = document.getElementById('robot-eye-right');

        this.rigEl = document.getElementById('satellite-rig');
        this.reticleEl = document.getElementById('rig-reticle');
    }

    setRobotDialogue(text, mood = 'happy') {
        if (!this.robotMsg) return;
        this.robotMsg.textContent = text;
        const color = mood === 'warning' ? '#ff9100' : (mood === 'alarm' ? '#ff1744' : '#00e676');
        if (this.robotEyeL && this.robotEyeR) {
            this.robotEyeL.setAttribute('fill', color);
            this.robotEyeR.setAttribute('fill', color);
        }
    }

    switchScreen(screenKey) {
        Object.values(this.screens).forEach(s => s?.classList.remove('active'));
        if (this.screens[screenKey]) {
            this.screens[screenKey].classList.add('active');
            this.currentScreen = screenKey;
        }

        let stepIdx = -1;
        if (screenKey === 's1') stepIdx = 0;
        else if (screenKey === 's2') stepIdx = 1;
        else if (screenKey === 's3') stepIdx = 2;
        else if (screenKey === 's4' || screenKey === 'victory') stepIdx = 3;

        this.navSteps.forEach((step, idx) => {
            if (!step) return;
            step.classList.remove('active', 'done');
            if (idx === stepIdx) step.classList.add('active');
            else if (idx < stepIdx) step.classList.add('done');
        });
    }

    // ================= MODAL DẪN CHUYỆN & GIAO NHIỆM VỤ CỦA FIRESAT BOT =================
    showStageBriefing(stageNum, callback = null) {
        this.currentStageNum = stageNum;
        this.pendingBriefingCallback = callback;

        const overlay = document.getElementById('briefing-modal-overlay');
        const data = window.GAME_DATA?.stageBriefings?.[stageNum];
        if (!overlay || !data) {
            if (callback) callback();
            return;
        }

        const tagEl = document.getElementById('briefing-stage-tag');
        const titleEl = document.getElementById('briefing-title');
        const storyEl = document.getElementById('briefing-story');
        const missionEl = document.getElementById('briefing-mission');
        const btnConfirm = document.getElementById('btn-briefing-confirm');

        if (tagEl) tagEl.textContent = `${data.icon} ${data.stageTag}`;
        if (titleEl) titleEl.textContent = data.title;
        if (storyEl) storyEl.textContent = data.story;
        if (missionEl) missionEl.textContent = data.mission;
        if (btnConfirm) btnConfirm.textContent = data.btnText;

        window.soundMgr.playBeep(700, 0.1);
        overlay.classList.add('active');
    }

    closeStageBriefing() {
        const overlay = document.getElementById('briefing-modal-overlay');
        if (overlay) overlay.classList.remove('active');
        window.soundMgr.playBeep(850, 0.08);

        if (this.pendingBriefingCallback) {
            const cb = this.pendingBriefingCallback;
            this.pendingBriefingCallback = null;
            cb();
        }
    }

    bindEvents() {
        // Nút xác nhận trong Modal Dẫn truyện
        document.getElementById('btn-briefing-confirm')?.addEventListener('click', () => {
            this.closeStageBriefing();
        });

        // Toggle Audio
        document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
            const muted = window.soundMgr.toggleMute();
            document.getElementById('btn-audio-toggle').textContent = muted ? '🔇' : '🔊';
        });

        // Intro -> Màn 1: Bật Modal Dẫn truyện Chặng 1 trước
        document.getElementById('btn-start-quest')?.addEventListener('click', () => {
            window.soundMgr.init();
            window.soundMgr.startBGM();
            this.showStageBriefing(1, () => this.startStage1());
        });

        // Tương tác Click trên Quả địa cầu 3D xoay quanh trục
        const globeCanvas = document.getElementById('globe-3d-canvas');
        if (globeCanvas) {
            globeCanvas.addEventListener('click', (e) => {
                if (!this.globe) return;
                const rect = globeCanvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                const res = this.globe.handleCanvasClick(clickX, clickY);

                if (res && res.success) {
                    this.handleCapturedAnomaly(res.id);
                } else if (res && res.reason === 'behind_earth') {
                    window.soundMgr.playWarning();
                    this.setRobotDialogue("Vệ tinh ở mặt sau, hãy đợi bay ra trước nhé!", "warning");
                } else if (res && (res.reason === 'outside_reticle' || res.reason === 'out_of_range')) {
                    window.soundMgr.playWarning();
                    this.setRobotDialogue("Chưa vào chùm quét! Hãy đợi tia rà trúng điểm nhé.", "warning");
                } else if (res && res.reason === 'no_target_in_scanner') {
                    window.soundMgr.playWarning();
                    this.setRobotDialogue("Chưa có mục tiêu trong chùm quét! Hãy đợi tia rà tới.", "warning");
                }
            });
        }

        // Nút mũi tên cuộn khay 16 ảnh thumbnail
        const thumbStrip = document.getElementById('photo-thumb-strip');
        document.getElementById('btn-thumb-prev')?.addEventListener('click', () => {
            if (thumbStrip) {
                thumbStrip.scrollBy({ left: -140, behavior: 'smooth' });
                window.soundMgr.playBeep(480, 0.05);
            }
        });
        document.getElementById('btn-thumb-next')?.addEventListener('click', () => {
            if (thumbStrip) {
                thumbStrip.scrollBy({ left: 140, behavior: 'smooth' });
                window.soundMgr.playBeep(560, 0.05);
            }
        });

        // Screen 1 -> Screen 2: Bật Modal Dẫn truyện Chặng 2
        document.getElementById('btn-goto-cleaning')?.addEventListener('click', () => {
            this.showStageBriefing(2, () => this.startStage2());
        });

        // Screen 2: Tương tác Kéo Thả trực tiếp vào 3 Cổng Năng Lượng (Energy Drop Pods) + Timeout Retry
        this.setupDragAndDrop();
        document.getElementById('btn-retry-stage2')?.addEventListener('click', () => this.retryStage2());

        // Điều khiển cuộn Cyber Deck ◀ ▶
        document.getElementById('btn-deck-left')?.addEventListener('click', () => {
            const strip = document.getElementById('tactical-deck-grid');
            if (strip) strip.scrollBy({ left: -200, behavior: 'smooth' });
            window.soundMgr.playBeep(480, 0.04);
        });
        document.getElementById('btn-deck-right')?.addEventListener('click', () => {
            const strip = document.getElementById('tactical-deck-grid');
            if (strip) strip.scrollBy({ left: 200, behavior: 'smooth' });
            window.soundMgr.playBeep(560, 0.04);
        });

        // Screen 2 -> Screen 3: Bật Modal Dẫn truyện Chặng 3
        document.getElementById('btn-goto-training')?.addEventListener('click', () => {
            this.showStageBriefing(3, () => this.startStage3());
        });

        // Screen 3: Neural Wiring & Reactor Controls
        document.getElementById('sensor-card-rgb')?.addEventListener('click', () => this.toggleCable('rgb'));
        document.getElementById('sensor-card-ir')?.addEventListener('click', () => this.toggleCable('ir'));
        document.getElementById('sensor-card-radar')?.addEventListener('click', () => this.toggleCable('radar'));

        // Slider Ngưỡng Nhiệt Độ Kích Hoạt
        const tempSlider = document.getElementById('slider-temp-threshold');
        tempSlider?.addEventListener('input', (e) => {
            this.setTempThreshold(parseInt(e.target.value, 10));
        });

        // Slider Số Lần Học (Epochs)
        const epochsSlider = document.getElementById('slider-epochs-count');
        epochsSlider?.addEventListener('input', (e) => {
            this.setEpochsCount(parseInt(e.target.value, 10));
        });

        // Screen 3: Train & Deploy
        document.getElementById('btn-exec-train')?.addEventListener('click', () => this.runModelTraining());
        document.getElementById('btn-deploy-sat')?.addEventListener('click', () => {
            this.showStageBriefing(4, () => this.startStage4());
        });

        // Screen 4: Emergency Fire Action
        document.getElementById('btn-fire-action')?.addEventListener('click', () => this.executeExtinguishOrder());

        // Screen 4: Nút quay lại Màn 3 khi AI thất bại
        document.getElementById('btn-back-to-stage3')?.addEventListener('click', () => {
            const failModal = document.getElementById('patrol-fail-modal');
            if (failModal) failModal.style.display = 'none';
            this.startStage3();
        });

        // Screen 5: Replay
        document.getElementById('btn-replay-all')?.addEventListener('click', () => this.resetGame());

        // Lắng nghe thay đổi hash URL để chuyển màn test tức thì
        window.addEventListener('hashchange', () => {
            this.checkURLRoute();
        });
    }

    // ================= TEST URL ROUTER (CHUYỂN MÀN NHANH QUA LINK) =================
    checkURLRoute() {
        const urlParams = new URLSearchParams(window.location.search);
        let stage = urlParams.get('stage');

        if (!stage && window.location.hash) {
            stage = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        }

        if (!stage) return;

        // Chuẩn hóa tên stage: "1", "2", "3", "4", "s1", "s2", "stage1", ...
        const s = stage.replace(/^(stage|s)/, '');
        if (s === '1') {
            this.startStage1();
        } else if (s === '2') {
            this.collectedPhotos = [...window.GAME_DATA.photos];
            this.startStage2();
        } else if (s === '3') {
            this.collectedPhotos = [...window.GAME_DATA.photos];
            this.startStage3();
        } else if (s === '4') {
            this.collectedPhotos = [...window.GAME_DATA.photos];
            const accParam = urlParams.get('acc');
            if (accParam) {
                this.lastAccuracy = parseFloat(accParam);
            }
            const threshParam = urlParams.get('thresh');
            if (threshParam) {
                this.tempThreshold = parseInt(threshParam, 10);
            }
            this.startStage4();
        }
    }

    // ================= MÀN 1: QUẢ ĐỊA CẦU 3D XOAY TRÒN & VỆ TINH RÀ QUÉT 2 CHIỀU =================
    startStage1() {
        this.currentStageNum = 1;
        this.switchScreen('s1');
        this.collectedPhotos = [];
        this.updateStage1HUD();

        if (!this.globe) {
            this.globe = new window.Earth3DGlobe('globe-3d-canvas');
        } else {
            this.globe.resize();
        }

        // Đảm bảo kích thước chuẩn xác ngay sau khi layout DOM ổn định
        setTimeout(() => {
            if (this.globe) this.globe.resize();
        }, 60);

        this.globe.onCaptureCallback = (id) => this.handleCapturedAnomaly(id);

        this.setRobotDialogue(
            "Chờ chùm quét trùm lên các tọa độ rồi click để chụp đủ 16 ảnh nhé!",
            "happy"
        );
    }

    handleCapturedAnomaly(photoId) {
        if (this.collectedPhotos.some(p => p.id === photoId)) return;

        const photoData = window.GAME_DATA.photos.find(p => p.id === photoId);
        if (!photoData) return;

        window.soundMgr.playShutter();
        this.collectedPhotos.push(photoData);

        const slot = document.getElementById(`thumb-${this.collectedPhotos.length}`);
        if (slot) {
            slot.innerHTML = `<img src="${photoData.imgSrc}" alt="${photoData.title}">`;
            slot.classList.add('filled');
            // Tự động cuộn mượt mà đưa ô ảnh vừa chụp vào giữa khay nhìn
            slot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        this.updateStage1HUD();

        if (this.collectedPhotos.length < 16) {
            let catTag = "";
            if (photoData.category === 'fire') catTag = "🔥 ĐỐM CHÁY";
            else if (photoData.category === 'safe') catTag = "🛡️ AN TOÀN";
            else catTag = "⚠️ ẢNH LỖI";

            this.setRobotDialogue(
                `Đã chụp [${catTag}]: ${photoData.title}. Còn ${16 - this.collectedPhotos.length} ảnh!`,
                "happy"
            );
        } else {
            window.soundMgr.playSuccess();
            this.setRobotDialogue(
                "Xuất sắc! Đã đủ 16 ảnh. Bấm nút dưới để sang Bước 2 nhé!",
                "happy"
            );
            const btnGoto = document.getElementById('btn-goto-cleaning');
            if (btnGoto) btnGoto.style.display = 'inline-block';
        }
    }

    updateStage1HUD() {
        const counter = document.getElementById('photo-counter-text');
        if (counter) {
            counter.textContent = `DỮ LIỆU ĐÃ THU THẬP: ${this.collectedPhotos.length}/16 ẢNH`;
        }
    }

    // ================= MÀN 2: CYBER THERMAL SCANNER (ARCADE GAMING) =================
    startStage2() {
        this.stopStage2Timer();
        this.currentStageNum = 2;
        this.switchScreen('s2');

        // Reset dữ liệu phân loại & Combo
        this.classifiedPhotoIds = new Set();
        this.cleanedCounts = { trash: 0, fire: 0, safe: 0 };
        this.selectedDeckPhotoId = null;
        this.comboStreak = 1;

        // Cập nhật Combo badge & Timer bar
        const comboBadge = document.getElementById('s2-combo-badge');
        if (comboBadge) {
            comboBadge.textContent = 'COMBO x1';
            comboBadge.classList.remove('pop');
        }
        const timerFill = document.getElementById('s2-timer-fill');
        if (timerFill) {
            timerFill.style.width = '100%';
            timerFill.classList.remove('urgent');
        }

        // Đảm bảo đủ 16 ảnh thực tế
        if (!this.collectedPhotos || this.collectedPhotos.length < 16) {
            this.collectedPhotos = [...window.GAME_DATA.photos];
        } else {
            // Tạo bản sao để không làm ảnh hưởng nguồn gốc
            this.collectedPhotos = [...this.collectedPhotos];
        }

        // Xáo trộn ngẫu nhiên toàn bộ 16 ảnh (Fisher-Yates Shuffle) để xuất hiện đan xen
        for (let i = this.collectedPhotos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.collectedPhotos[i], this.collectedPhotos[j]] = [this.collectedPhotos[j], this.collectedPhotos[i]];
        }

        // Ẩn nút sang bước 3 & ẩn popup timeout
        const btnGotoTrain = document.getElementById('btn-goto-training');
        if (btnGotoTrain) btnGotoTrain.style.display = 'none';
        const timeoutOverlay = document.getElementById('s2-timeout-overlay');
        if (timeoutOverlay) timeoutOverlay.classList.remove('show');

        // Cập nhật counters
        this.updateCleaningCounters();

        // Render 16 thẻ ảnh Cyber Cards Deck
        this.renderTacticalDeck();

        // Chọn thẻ đầu tiên chiếu vào Hologram Scanner Chamber
        if (this.collectedPhotos.length > 0) {
            this.selectDeckPhoto(this.collectedPhotos[0].id);
        }

        // Khởi động Orbit Sync Countdown Timer 70 giây
        this.startStage2Timer();

        this.setRobotDialogue(
            "Kéo thẻ ảnh thả vào đúng 3 khay phân loại trước khi hết giờ!",
            "happy"
        );
    }

    renderTacticalDeck() {
        const grid = document.getElementById('tactical-deck-grid');
        if (!grid) return;
        grid.innerHTML = '';

        this.collectedPhotos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'deck-card';
            card.id = `deck-card-${photo.id}`;
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-photo-id', String(photo.id));

            const idStr = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
            const tempStr = photo.category === 'trash' ? 'ERR' : `${photo.tempCelsius}°C`;

            card.innerHTML = `
                <div class="deck-card-thumb">
                    <img src="${photo.imgSrc}" alt="${photo.title}">
                    <div class="deck-card-id">#${idStr}</div>
                </div>
                <div class="deck-card-meta">
                    <span class="deck-card-name" title="${photo.title}">${photo.title}</span>
                    <span class="deck-card-temp">${tempStr}</span>
                </div>
            `;

            // Click vào thẻ để chiếu thông số lên buồng Hologram trung tâm
            card.addEventListener('click', () => {
                this.selectDeckPhoto(photo.id);
            });

            // Kéo chuột trên máy tính (Desktop Drag & Drop)
            card.addEventListener('dragstart', (e) => {
                if (this.classifiedPhotoIds.has(photo.id)) {
                    e.preventDefault();
                    return;
                }
                this.selectDeckPhoto(photo.id);
                e.dataTransfer.setData('text/plain', String(photo.id));
                e.dataTransfer.effectAllowed = 'move';
            });

            // Kéo thả cảm ứng trên Máy tính bảng & Màn hình chạm (Touch Drag & Drop)
            let touchGhost = null;
            let touchStartX = 0, touchStartY = 0;
            let isTouchDragging = false;

            card.addEventListener('touchstart', (e) => {
                if (this.classifiedPhotoIds.has(photo.id)) return;
                this.selectDeckPhoto(photo.id);
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                isTouchDragging = false;
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                if (this.classifiedPhotoIds.has(photo.id)) return;
                const touch = e.touches[0];
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;

                // Khi ngón tay bắt đầu kéo rời khỏi vị trí: kích hoạt bóng thẻ bay theo tay
                if (!isTouchDragging && (Math.abs(dy) > 8 || Math.abs(dx) > 12)) {
                    isTouchDragging = true;
                    touchGhost = card.cloneNode(true);
                    touchGhost.className = 'deck-card deck-card-ghost';
                    touchGhost.style.width = `${card.offsetWidth}px`;
                    touchGhost.style.height = `${card.offsetHeight}px`;
                    document.body.appendChild(touchGhost);
                }

                if (isTouchDragging && touchGhost) {
                    if (e.cancelable) e.preventDefault(); // Ngăn cuộn trang khi đang kéo thẻ
                    touchGhost.style.left = `${touch.clientX}px`;
                    touchGhost.style.top = `${touch.clientY}px`;

                    // Tìm khay phân loại bên dưới đầu ngón tay
                    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                    document.querySelectorAll('.energy-drop-pod').forEach(p => p.classList.remove('drag-over'));
                    if (elemBelow) {
                        const pod = elemBelow.closest('.energy-drop-pod');
                        if (pod) pod.classList.add('drag-over');
                    }
                }
            }, { passive: false });

            const finishTouchDrag = (e) => {
                if (touchGhost) {
                    const touch = e.changedTouches ? e.changedTouches[0] : null;
                    document.querySelectorAll('.energy-drop-pod').forEach(p => p.classList.remove('drag-over'));
                    if (touch) {
                        const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (elemBelow) {
                            const pod = elemBelow.closest('.energy-drop-pod');
                            if (pod) {
                                const target = pod.getAttribute('data-target');
                                if (target) {
                                    this.classifyPhoto(photo.id, target);
                                }
                            }
                        }
                    }
                    touchGhost.remove();
                    touchGhost = null;
                }
                isTouchDragging = false;
            };

            card.addEventListener('touchend', finishTouchDrag);
            card.addEventListener('touchcancel', finishTouchDrag);

            grid.appendChild(card);
        });
    }

    selectDeckPhoto(photoId) {
        const photo = window.GAME_DATA.photos.find(p => p.id === photoId);
        if (!photo) return;

        this.selectedDeckPhotoId = photoId;

        // Cập nhật highlight viền thẻ dưới khay
        document.querySelectorAll('.deck-card').forEach(c => c.classList.remove('selected'));
        const activeCard = document.getElementById(`deck-card-${photoId}`);
        if (activeCard && !this.classifiedPhotoIds.has(photoId)) {
            activeCard.classList.add('selected');
            // Cuộn thẻ đang chọn vào giữa tầm nhìn
            activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        // Cập nhật thông số lên buồng hiển thị
        const realImg = document.getElementById('inspect-real-img');
        const descEl = document.getElementById('card-desc-text');
        const tempValEl = document.getElementById('temp-display-val');
        const tempMarker = document.getElementById('temp-gauge-marker');

        if (realImg) realImg.src = photo.imgSrc;
        if (descEl) {
            descEl.innerHTML = `<strong style="color: var(--neon-blue);">${photo.spectrum}</strong>: ${photo.description}`;
        }

        // Cập nhật đồng hồ nhiệt độ LED Speedo Temp
        if (tempValEl) {
            if (photo.category === 'trash') {
                tempValEl.textContent = 'ERR (0°C)';
                tempValEl.style.color = '#90a4ae';
            } else if (photo.tempCelsius >= 200) {
                tempValEl.textContent = `${photo.tempCelsius}°C`;
                tempValEl.style.color = '#ff1744';
            } else {
                tempValEl.textContent = `${photo.tempCelsius}°C`;
                tempValEl.style.color = '#00e676';
            }
        }

        // Cập nhật vạch đo nhiệt kế dọc (Vertical Thermal Tower 0 - 600°C)
        if (tempMarker) {
            const pct = photo.category === 'trash'
                ? 5
                : Math.min(95, Math.max(5, (photo.tempCelsius / 600) * 100));
            tempMarker.style.bottom = `${pct}%`;
        }

        window.soundMgr.playBeep(640, 0.03);
    }

    setupDragAndDrop() {
        const pods = document.querySelectorAll('.energy-drop-pod, .cyber-terminal-bay');

        pods.forEach(pod => {
            pod.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                pod.classList.add('drag-over');
            });

            pod.addEventListener('dragleave', () => {
                pod.classList.remove('drag-over');
            });

            pod.addEventListener('drop', (e) => {
                e.preventDefault();
                pod.classList.remove('drag-over');
                const rawId = e.dataTransfer.getData('text/plain');
                const photoId = parseInt(rawId, 10);
                const target = pod.getAttribute('data-target');

                if (!isNaN(photoId) && target) {
                    this.classifyPhoto(photoId, target);
                }
            });

            // Phân loại duy nhất thông qua sự kiện Drag & Drop
        });
    }

    classifyPhoto(photoId, targetZone) {
        if (this.classifiedPhotoIds.has(photoId)) return;

        const photo = window.GAME_DATA.photos.find(p => p.id === photoId);
        if (!photo) return;

        const cardEl = document.getElementById(`deck-card-${photoId}`);
        const comboBadge = document.getElementById('s2-combo-badge');

        if (targetZone === photo.correctBox) {
            // Đúng phân loại -> Tăng Combo Streak
            window.soundMgr.playSuccess();
            this.classifiedPhotoIds.add(photo.id);
            this.cleanedCounts[targetZone]++;
            this.comboStreak = (this.comboStreak || 1) + 1;

            if (comboBadge) {
                comboBadge.textContent = `COMBO x${this.comboStreak}`;
                comboBadge.classList.remove('pop');
                void comboBadge.offsetWidth;
                comboBadge.classList.add('pop');
            }

            // Hiệu ứng phát sáng trên Drop Pod
            const podEl = document.getElementById(`zone-${targetZone}`);
            if (podEl) {
                podEl.classList.remove('drag-over');
                podEl.style.boxShadow = '0 0 28px rgba(0, 230, 118, 0.8)';
                setTimeout(() => { podEl.style.boxShadow = ''; }, 400);
            }

            this.updateCleaningCounters();

            if (cardEl) {
                cardEl.classList.remove('selected');
                cardEl.classList.add('classified');
                cardEl.setAttribute('draggable', 'false');
            }

            let feedback = "Chính xác! ";
            if (targetZone === 'trash') feedback += "Đã cô lập dữ liệu lỗi cảm biến!";
            else if (targetZone === 'fire') feedback += `Nhiệt độ ${photo.tempCelsius}°C (>200°C): Cảnh báo Đốm Cháy!`;
            else feedback += `Nhiệt độ ${photo.tempCelsius}°C (<60°C): Khu vực Mát An Toàn!`;

            this.setRobotDialogue(feedback, "happy");

            // Tự động chuyển Hologram sang thẻ kế tiếp chưa phân loại
            const nextPhoto = this.collectedPhotos.find(p => !this.classifiedPhotoIds.has(p.id));
            if (nextPhoto) {
                this.selectDeckPhoto(nextPhoto.id);
            }

            // Hoàn thành 16 ảnh
            if (this.classifiedPhotoIds.size >= 16) {
                this.finishStage2();
            }
        } else {
            // Sai phân loại -> Reset Combo về 1 & rung cảnh báo
            window.soundMgr.playWarning();
            this.comboStreak = 1;
            if (comboBadge) {
                comboBadge.textContent = 'COMBO x1';
            }

            if (cardEl) {
                cardEl.classList.remove('shake');
                void cardEl.offsetWidth;
                cardEl.classList.add('shake');
            }

            const holoPanel = document.getElementById('hologram-inspect-panel');
            if (holoPanel) {
                holoPanel.classList.remove('shake');
                void holoPanel.offsetWidth;
                holoPanel.classList.add('shake');
            }

            this.setRobotDialogue(photo.hintWrong, "warning");
        }
    }

    updateCleaningCounters() {
        const countTxt = document.getElementById('cleaning-counter');
        const countTrash = document.getElementById('count-trash');
        const countFire = document.getElementById('count-fire');
        const countSafe = document.getElementById('count-safe');

        const totalDone = this.classifiedPhotoIds.size;
        if (countTxt) countTxt.textContent = `${totalDone} / 16 ẢNH`;
        if (countFire) countFire.textContent = `${this.cleanedCounts.fire}/5`;
        if (countSafe) countSafe.textContent = `${this.cleanedCounts.safe}/7`;
        if (countTrash) countTrash.textContent = `${this.cleanedCounts.trash}/4`;
    }

    finishStage2() {
        this.stopStage2Timer();
        window.soundMgr.playSuccess();
        this.setRobotDialogue(
            "Tuyệt đỉnh! Đã lọc sạch và phân tích toàn bộ 16 ảnh viễn thám. Bấm nút dưới để sang Bước 3!",
            "happy"
        );
        const btnGotoTrain = document.getElementById('btn-goto-training');
        if (btnGotoTrain) btnGotoTrain.style.display = 'inline-block';
    }

    // ================= TIMER ĐẾM NGƯỢC 70S CHO MÀN 2 (ARCADE ENERGY BAR) =================
    startStage2Timer() {
        this.stopStage2Timer();
        this.stage2TimeRemaining = 70;

        const countdownEl = document.getElementById('s2-countdown');
        const timerFill = document.getElementById('s2-timer-fill');

        if (countdownEl) countdownEl.textContent = '70';
        if (timerFill) {
            timerFill.style.width = '100%';
            timerFill.classList.remove('urgent');
        }

        this.stage2Timer = setInterval(() => {
            this.stage2TimeRemaining--;

            if (countdownEl) countdownEl.textContent = String(this.stage2TimeRemaining);

            const pct = Math.max(0, (this.stage2TimeRemaining / 70) * 100);
            if (timerFill) {
                timerFill.style.width = `${pct}%`;
            }

            // Báo động khẩn cấp dưới 15 giây
            if (this.stage2TimeRemaining <= 15) {
                if (timerFill) timerFill.classList.add('urgent');
                window.soundMgr.playBeep(420, 0.03);
            }

            // Hết giờ
            if (this.stage2TimeRemaining <= 0) {
                this.stopStage2Timer();
                this.handleStage2Timeout();
            }
        }, 1000);
    }

    stopStage2Timer() {
        if (this.stage2Timer) {
            clearInterval(this.stage2Timer);
            this.stage2Timer = null;
        }
    }

    handleStage2Timeout() {
        window.soundMgr.playWarning();
        const timeoutOverlay = document.getElementById('s2-timeout-overlay');
        if (timeoutOverlay) timeoutOverlay.classList.add('show');

        this.setRobotDialogue(
            "Hết thời gian! Bấm Thử lại nhé!",
            "warning"
        );
    }

    retryStage2() {
        const timeoutOverlay = document.getElementById('s2-timeout-overlay');
        if (timeoutOverlay) timeoutOverlay.classList.remove('show');
        this.startStage2();
    }

    // ================= MÀN 3: MẠNG NƠ-RON NHÂN TẠO ANN (3 SENSORS & STRICT SYNAPSE LIVENESS) =================
    startStage3() {
        this.currentStageNum = 3;
        this.switchScreen('s3');
        this.setRobotDialogue(
            "Bấm bật các loại cảm biến và điều chỉnh thanh trượt để huấn luyện AI nhé!",
            "happy"
        );

        // Khởi tạo mặc định: tắt hết cả 3 cảm biến, nhiệt 50°C, số lần học 5
        this.cables = { rgb: false, ir: false, radar: false };
        this.tempThreshold = 50;
        this.selectedEpochs = 5;

        this.updateCableUI();
        this.updateTempThresholdUI();
        this.updateEpochsUI();

        const btnDeploy = document.getElementById('btn-deploy-sat');
        if (btnDeploy) btnDeploy.style.display = 'none';

        const btnTrain = document.getElementById('btn-exec-train');
        if (btnTrain) {
            btnTrain.style.display = 'inline-block';
            btnTrain.textContent = '⚡ CHẠY HUẤN LUYỆN';
        }

        const fillBar = document.getElementById('tuning-fill-bar');
        if (fillBar) fillBar.style.width = '0%';

        const pctLbl = document.getElementById('tuning-percent-label');
        if (pctLbl) pctLbl.textContent = '0%';

        const statusLbl = document.getElementById('tuning-status-label');
        if (statusLbl) statusLbl.textContent = 'Sẵn sàng huấn luyện mạng nơ-ron...';

        const teleAcc = document.getElementById('tele-acc-val');
        if (teleAcc) teleAcc.textContent = '-- %';

        const pillFire = document.getElementById('out-fire-pill');
        const pillSafe = document.getElementById('out-safe-pill');
        if (pillFire) pillFire.classList.remove('active');
        if (pillSafe) pillSafe.classList.remove('active');

        const board = document.getElementById('ann-board-container');
        if (board) {
            board.classList.remove('overfitting');
            board.classList.remove('training-active');
        }
    }

    toggleCable(sensorType) {
        this.cables[sensorType] = !this.cables[sensorType];
        this.updateCableUI();

        if (this.cables[sensorType]) {
            window.soundMgr.playBeep(850, 0.04);
        } else {
            window.soundMgr.playBeep(320, 0.04);
        }
    }

    updateCableUI() {
        // 1. Cập nhật trạng thái phát sáng cho 3 thẻ cảm biến đầu vào
        ['rgb', 'ir', 'radar'].forEach(type => {
            const isPlugged = !!this.cables[type];
            const cardEl = document.getElementById(`sensor-card-${type}`);
            if (cardEl) {
                cardEl.classList.toggle('active', isPlugged);
            }
        });

        // 2. BẢN ĐỒ TRẠNG THÁI SỐNG / CHẾT CỦA TỪNG NƠ-RON (NODE LIVENESS MAP)
        const hasAny = this.cables.rgb || this.cables.ir || this.cables.radar;
        const isAlive = {
            'node-in-rgb': !!this.cables.rgb,
            'node-in-ir': !!this.cables.ir,
            'node-in-radar': !!this.cables.radar,
            'node-h1-1': !!this.cables.rgb,
            'node-h1-2': !!this.cables.rgb,
            'node-h1-3': !!this.cables.ir,
            'node-h1-4': !!this.cables.ir,
            'node-h1-5': !!this.cables.radar,
            'node-h1-6': !!this.cables.radar,
            'node-h2-1': !!this.cables.rgb,
            'node-h2-2': !!this.cables.rgb,
            'node-h2-3': !!this.cables.ir,
            'node-h2-4': !!this.cables.ir,
            'node-h2-5': !!this.cables.radar,
            'node-h2-6': !!this.cables.radar,
            'node-out-fire': hasAny,
            'node-out-safe': hasAny
        };

        // 3. Cập nhật từng node nơ-ron (Sáng nếu sống, tối xám nếu chết)
        document.querySelectorAll('.ann-node-circle').forEach(node => {
            const alive = !!isAlive[node.id];
            node.classList.toggle('node-off', !alive);
        });

        // 4. CẬP NHẬT TỪNG ĐƯỜNG NỐI SYNAPSE:
        // NGUYÊN TẮC: Đường nối CHỈ ĐƯỢC PHÉP SÁNG khi CẢ HAI ĐẦU (from và to) ĐỀU SỐNG!
        // Bất kỳ node đầu hoặc cuối nào bị tắt -> ĐƯỜNG NỐI BIẾN MẤT HOÀN TOÀN!
        document.querySelectorAll('.ann-svg-matrix line').forEach(line => {
            const fromId = line.getAttribute('data-from');
            const toId = line.getAttribute('data-to');
            const lineAlive = !!(isAlive[fromId] && isAlive[toId]);
            line.classList.toggle('active', lineAlive);
            line.classList.toggle('synapse-off', !lineAlive);
        });
    }

    setTempThreshold(val) {
        this.tempThreshold = Math.max(50, Math.min(500, val));
        this.updateTempThresholdUI();
        window.soundMgr.playBeep(260 + Math.floor(this.tempThreshold / 2), 0.015);
    }

    updateTempThresholdUI() {
        const badge = document.getElementById('thresh-val-display');
        const slider = document.getElementById('slider-temp-threshold');

        if (slider && parseInt(slider.value, 10) !== this.tempThreshold) {
            slider.value = this.tempThreshold;
        }

        if (badge) {
            badge.textContent = `${this.tempThreshold}°C`;
        }
    }

    setEpochsCount(val) {
        this.selectedEpochs = Math.max(5, Math.min(70, val));
        this.updateEpochsUI();
        window.soundMgr.playBeep(450 + this.selectedEpochs * 4, 0.015);

        // Hiệu ứng cảnh báo khi học quá 50 lần (Overfitting - Quá nhiệt)
        const board = document.getElementById('ann-board-container');
        if (board) {
            if (this.selectedEpochs > 50) {
                board.classList.add('overfitting');
            } else {
                board.classList.remove('overfitting');
            }
        }
    }

    updateEpochsUI() {
        const badge = document.getElementById('epoch-val-display');
        const slider = document.getElementById('slider-epochs-count');

        if (slider && parseInt(slider.value, 10) !== this.selectedEpochs) {
            slider.value = this.selectedEpochs;
        }

        if (badge) {
            badge.textContent = `${this.selectedEpochs} LẦN`;
            if (this.selectedEpochs > 50) {
                badge.style.color = '#ff1744';
            } else {
                badge.style.color = 'var(--neon-green)';
            }
        }
    }

    runModelTraining() {
        const btnTrain = document.getElementById('btn-exec-train');
        if (btnTrain) btnTrain.style.display = 'none';

        const board = document.getElementById('ann-board-container');
        if (board) board.classList.add('training-active');

        const fillBar = document.getElementById('tuning-fill-bar');
        const percentTxt = document.getElementById('tuning-percent-label');
        const statusTxt = document.getElementById('tuning-status-label');
        const teleAcc = document.getElementById('tele-acc-val');

        // 1. Phân tích số lượng và loại cảm biến đang cắm
        const activeCables = [];
        if (this.cables.rgb) activeCables.push('rgb');
        if (this.cables.ir) activeCables.push('ir');
        if (this.cables.radar) activeCables.push('radar');

        let baseAcc = 0;
        if (activeCables.length === 0) {
            baseAcc = 0;
        } else if (activeCables.length === 1) {
            if (this.cables.ir) baseAcc = 44.5;
            else if (this.cables.rgb) baseAcc = 38.0;
            else baseAcc = 36.0; // radar
        } else if (activeCables.length === 2) {
            if (this.cables.rgb && this.cables.ir) baseAcc = 82.5;
            else if (this.cables.ir && this.cables.radar) baseAcc = 86.5;
            else baseAcc = 64.0; // rgb + radar (thiếu cảm biến nhiệt)
        } else {
            // Đủ cả 3 cảm biến viễn thám vũ trụ
            baseAcc = 100.0;
        }

        // 2. Hệ số ngưỡng nhiệt độ
        let tempFactor = 1.0;
        if (this.tempThreshold < 160) {
            tempFactor = 0.72;
        } else if (this.tempThreshold > 300) {
            tempFactor = 0.70;
        } else if (this.tempThreshold < 180 || this.tempThreshold > 240) {
            tempFactor = 0.88;
        } else {
            tempFactor = 1.0; // 180 - 240°C
        }

        // 3. Hệ số số lần học (Epochs)
        let epochFactor = 1.0;
        if (this.selectedEpochs < 20) {
            epochFactor = 0.55; // Chưa học tới
        } else if (this.selectedEpochs < 35) {
            epochFactor = 0.80; // Chưa học đủ
        } else if (this.selectedEpochs <= 50) {
            epochFactor = 1.0; // Tối ưu (Sweet spot 40-50 lần)
        } else {
            // Quá 50 lần: BỊ HỌC VẸT (OVERFITTING)! Tụt điểm theo số lần học dư thừa!
            const over = this.selectedEpochs - 50; // 5, 10, 15, 20
            epochFactor = Math.max(0.60, 1.0 - (over * 0.022));
        }

        let targetAcc = baseAcc * tempFactor * epochFactor;
        if (activeCables.length === 3 && tempFactor === 1.0 && this.selectedEpochs >= 40 && this.selectedEpochs <= 50) {
            targetAcc = 99.2;
        } else {
            targetAcc = Math.min(94.5, Math.round(targetAcc * 10) / 10);
        }

        let pct = 0;
        const timer = setInterval(() => {
            pct += Math.floor(Math.random() * 4) + 3;
            if (pct > 100) pct = 100;

            if (pct % 15 === 0) window.soundMgr.playComputeTick();
            if (fillBar) fillBar.style.width = `${pct}%`;
            if (percentTxt) percentTxt.textContent = `${pct}%`;

            const curAcc = ((pct / 100) * targetAcc).toFixed(1);
            if (teleAcc) teleAcc.textContent = `${curAcc}%`;

            if (pct < 30) {
                if (statusTxt) statusTxt.textContent = `Nạp dữ liệu từ ${activeCables.length}/3 cảm biến vào mạng nơ-ron...`;
            } else if (pct < 75) {
                if (statusTxt) statusTxt.textContent = `Các nơ-ron đang kích hoạt và học ${this.selectedEpochs} lần...`;
            } else if (pct < 100) {
                if (statusTxt) statusTxt.textContent = 'Kiểm tra độ chính xác phân loại lửa và rừng...';
            } else {
                clearInterval(timer);
                if (board) board.classList.remove('training-active');
                this.evaluateTuningResults(targetAcc);
            }
        }, 50);
    }

    evaluateTuningResults(finalAcc) {
        this.lastAccuracy = finalAcc;
        const btnDeploy = document.getElementById('btn-deploy-sat');
        const btnTrain = document.getElementById('btn-exec-train');
        const pillFire = document.getElementById('out-fire-pill');
        const pillSafe = document.getElementById('out-safe-pill');
        const teleAcc = document.getElementById('tele-acc-val');

        const activeCount = (this.cables.rgb ? 1 : 0) + (this.cables.ir ? 1 : 0) + (this.cables.radar ? 1 : 0);

        // Đánh giá phản hồi sư phạm dựa trên thông số người chơi đã chọn
        let feedbackMsg = "";

        if (activeCount === 0) {
            feedbackMsg = "Chưa cắm dây cảm biến nào! AI chỉ đoán mò với độ chính xác 10%. Hãy cắm thêm cảm biến hoặc bấm nạp vệ tinh để xem lỗi thực tế!";
        } else if (activeCount === 1) {
            if (this.cables.rgb) feedbackMsg = "Chỉ có Camera Quang học! Mái tôn lóa nắng làm AI bị nhầm lẫn!";
            else if (this.cables.ir) feedbackMsg = "Chỉ có Cảm biến Nhiệt! Thấy điểm nóng nhưng không rõ là nhà máy hay cháy rừng!";
            else feedbackMsg = "Chỉ có Radar Xuyên Mây! Thấy địa hình qua mây mù nhưng thiếu mắt đo nhiệt độ!";
        } else if (activeCount === 2) {
            if (!this.cables.ir) feedbackMsg = "Thiếu Cảm biến Nhiệt! Cần đo bức xạ nhiệt để chắc chắn là lửa!";
            else if (!this.cables.rgb) feedbackMsg = "Thiếu Camera Quang học! Cần nhìn màu sắc thực tế của cảnh quan rừng!";
            else feedbackMsg = "Thiếu Radar Xuyên Mây! Mây mù và khói dày làm che mất tầm nhìn camera!";
        } else if (this.tempThreshold < 160) {
            feedbackMsg = `Mức nhiệt ${this.tempThreshold}°C quá thấp! Trưa hè mái tôn ấm lên AI cũng tưởng là lửa!`;
        } else if (this.tempThreshold > 300) {
            feedbackMsg = `Mức nhiệt ${this.tempThreshold}°C quá cao! Bỏ lọt các đốm lửa mới nhen nhóm ở 200°C!`;
        } else if (this.selectedEpochs < 35) {
            feedbackMsg = `Mới học ${this.selectedEpochs} lần (Underfitting)! Số lần học còn ít quá, AI chưa thuộc bài!`;
        } else if (this.selectedEpochs > 50) {
            feedbackMsg = `Học tới ${this.selectedEpochs} lần là bị HỌC VẸT (Overfitting)! AI nhớ máy móc chi tiết thừa nên đoán sai!`;
        } else if (this.tempThreshold < 180 || this.tempThreshold > 240) {
            feedbackMsg = `Mức nhiệt ${this.tempThreshold}°C hơi lệch ngưỡng tối ưu một chút!`;
        } else {
            // Đạt chuẩn xuất sắc
            feedbackMsg = `Xuất sắc! AI đạt độ chính xác ${finalAcc}% (≥98%). Mô hình tối ưu sẵn sàng dập tắt mọi đám cháy!`;
        }

        if (teleAcc) {
            teleAcc.textContent = `${finalAcc}%`;
            if (finalAcc >= 98.0) {
                teleAcc.style.color = 'var(--neon-green)';
            } else if (finalAcc >= 80.0) {
                teleAcc.style.color = '#ffea00';
            } else {
                teleAcc.style.color = '#ff1744';
            }
        }

        if (finalAcc >= 98.0) {
            window.soundMgr.playSuccess();
            if (pillFire) pillFire.classList.add('active');
            if (pillSafe) pillSafe.classList.add('active');
            this.setRobotDialogue(feedbackMsg, "happy");
        } else {
            window.soundMgr.playWarning();
            if (pillFire) pillFire.classList.remove('active');
            if (pillSafe) pillSafe.classList.remove('active');
            this.setRobotDialogue(`${feedbackMsg} (Độ chính xác: ${finalAcc}% - chưa đạt 98%). CẢNH BÁO: AI có thể nhận diện sai tại Màn 4!`, "warning");
        }

        // LUÔN CHO PHÉP CHỌN: Chỉnh & Huấn luyện lại HOẶC Nạp vào vệ tinh thử nghiệm thực tế
        if (btnTrain) {
            btnTrain.style.display = 'inline-block';
            btnTrain.textContent = '🔄 CHỈNH & HUẤN LUYỆN LẠI';
        }
        if (btnDeploy) {
            btnDeploy.style.display = 'inline-block';
            if (finalAcc >= 98.0) {
                btnDeploy.style.background = 'linear-gradient(135deg, #00b0ff, #00e676)';
                btnDeploy.style.color = '#000';
                btnDeploy.textContent = '🛰️ VÀO TUẦN TRA DẬP LỬA (ĐẠT CHUẨN) ➔';
            } else {
                btnDeploy.style.background = 'linear-gradient(135deg, #ff9100, #ff1744)';
                btnDeploy.style.color = '#fff';
                btnDeploy.textContent = `🛰️ THỬ NGHIỆM VỆ TINH (${finalAcc}%) ➔`;
            }
        }
    }

    // ================= MÀN 4: TUẦN TRA THỰC ĐỊA & AI TỰ ĐỘNG NHẬN DIỆN (8 MẪU ĐA DẠNG NHIỆT) =================
    startStage4() {
        this.currentStageNum = 4;
        this.switchScreen('s4');

        // Đảm bảo ẩn modal thất bại nếu đang mở
        const failModal = document.getElementById('patrol-fail-modal');
        if (failModal) failModal.style.display = 'none';

        const heliImg = document.getElementById('heli-img');
        if (heliImg) {
            heliImg.src = 'assets/images/fire_helicopter_rescue_iso.png?v=9';
        }

        // 8 MẪU THỰC ĐỊA VỚI PHỔ NHIỆT ĐỘ ĐA DẠNG (TỪ 22°C ĐẾN 540°C)
        const PATROL_POIS = [
            // 4 VẬT THỂ AN TOÀN (KHÔNG CÓ LỬA): Nhiệt từ 22°C đến 165°C
            { id: 'poi-1', title: 'HỒ NƯỚC NÚI ĐÁ', isFire: false, temp: 22, img: 'assets/images/safe_3.jpg', x: 16, y: 72 },
            { id: 'poi-2', title: 'MÁI TÔN NHÀ KHO', isFire: false, temp: 68, img: 'assets/images/safe_1.jpg', x: 64, y: 18 },
            { id: 'poi-3', title: 'BÃI ĐÁ NẮNG GẮT', isFire: false, temp: 120, img: 'assets/images/safe_4.jpg', x: 84, y: 35 },
            { id: 'poi-4', title: 'LÒ SẤY GỖ BÌA RỪNG', isFire: false, temp: 165, img: 'assets/images/safe_2.jpg', x: 38, y: 80 },

            // 4 ĐỐM CHÁY RỪNG THỰC TẾ: Nhiệt từ 195°C đến 540°C
            { id: 'poi-5', title: 'TÀN THAN 5m × 5m', isFire: true, temp: 195, img: 'assets/images/fire_3.jpg', x: 44, y: 52 },
            { id: 'poi-6', title: 'CHÁY MÙN CƯA SƯỜN DỐC', isFire: true, temp: 280, img: 'assets/images/fire_1.jpg', x: 26, y: 26 },
            { id: 'poi-7', title: 'ĐỐM CHÁY TÁN CÂY KHÔ', isFire: true, temp: 390, img: 'assets/images/fire_5.jpg', x: 76, y: 64 },
            { id: 'poi-8', title: 'ĐẠI HỎA HOẠN BÌA RỪNG', isFire: true, temp: 540, img: 'assets/images/fire_2.jpg', x: 52, y: 22 }
        ];

        this.patrolPOIs = PATROL_POIS;
        this.fireTargets = [];
        this.falseAlarms = [];
        this.missedFires = [];

        // Lấy ngưỡng nhiệt độ đã nạp từ Màn 3
        const threshold = typeof this.tempThreshold === 'number' ? this.tempThreshold : 200;
        const acc = this.lastAccuracy !== undefined ? this.lastAccuracy : 99.2;

        const valThreshEl = document.getElementById('val-ai-thresh');
        const valAccEl = document.getElementById('val-ai-acc');
        const fireCntEl = document.getElementById('val-fire-count');
        const safeCntEl = document.getElementById('val-safe-count');
        const summaryTag = document.getElementById('patrol-ai-summary');
        const btnAction = document.getElementById('btn-fire-action');

        if (valThreshEl) valThreshEl.textContent = `${threshold}°C`;
        if (valAccEl) {
            valAccEl.textContent = `${acc}%`;
            valAccEl.style.color = acc >= 98.0 ? 'var(--neon-green)' : (acc >= 80 ? '#ffea00' : '#ff1744');
        }
        if (fireCntEl) fireCntEl.textContent = '0 / 4';
        if (safeCntEl) safeCntEl.textContent = '0 / 4';
        if (summaryTag) {
            summaryTag.textContent = '📡 VỆ TINH ĐANG QUÉT MÔ HÌNH AI...';
            summaryTag.style.borderColor = 'var(--neon-blue)';
            summaryTag.style.color = 'var(--neon-blue)';
        }
        if (btnAction) {
            btnAction.disabled = true;
            btnAction.textContent = '⏳ AI ĐANG QUÉT VÀ PHÂN TÍCH NHIỆT...';
        }

        const heli = document.getElementById('patrol-heli');
        if (heli) {
            heli.classList.remove('arrived');
            heli.style.left = '-240px';
            heli.style.top = '60px';
        }

        // Render 8 điểm POI lên bản đồ
        const container = document.getElementById('patrol-poi-container');
        if (!container) return;
        container.innerHTML = '';

        PATROL_POIS.forEach(poi => {
            const card = document.createElement('div');
            card.className = 'patrol-poi-card';
            card.id = poi.id;
            card.style.left = `${poi.x}%`;
            card.style.top = `${poi.y}%`;

            card.innerHTML = `
                <div class="poi-thumb-wrapper">
                    <img src="${poi.img}" alt="${poi.title}" class="poi-thumb-img">
                    ${poi.isFire ? '<div class="poi-fire-fx" id="fire-fx-' + poi.id + '" style="display: none;"></div>' : ''}
                    <div class="ai-bbox scanning" id="bbox-${poi.id}"></div>
                </div>
                <div class="ai-tag-chip tag-scanning" id="tag-${poi.id}">ĐANG QUÉT...</div>
            `;
            container.appendChild(card);
        });

        this.setRobotDialogue(
            `Vệ tinh FireSat đang quét 8 tọa độ với ngưỡng nhiệt độ AI đã nạp là ${threshold}°C...`,
            "happy"
        );

        // Tiến trình AI tự động quét từng điểm dựa trên quy tắc ngưỡng nhiệt (Threshold logic)
        let scannedCount = 0;
        let correctlyIdentifiedCount = 0;
        let firesLocked = 0;
        let safeFiltered = 0;

        const scanOrder = [0, 1, 2, 3, 4, 5, 6, 7];
        scanOrder.forEach((idx, step) => {
            setTimeout(() => {
                const poi = PATROL_POIS[idx];
                const bbox = document.getElementById(`bbox-${poi.id}`);
                const tag = document.getElementById(`tag-${poi.id}`);
                const fireFx = document.getElementById(`fire-fx-${poi.id}`);

                if (!bbox || !tag) return;
                bbox.classList.remove('scanning');
                tag.classList.remove('tag-scanning');

                // NGUYÊN LÝ LOGIC:
                // Nếu nhiệt độ thực địa >= ngưỡng đã chọn -> AI đoán là CHÁY
                // Nếu nhiệt độ thực địa < ngưỡng đã chọn -> AI đoán là AN TOÀN
                const aiPredictsFire = poi.temp >= threshold;

                if (aiPredictsFire) {
                    bbox.classList.add('fire-locked');
                    tag.classList.add('tag-fire');
                    firesLocked++;
                    this.fireTargets.push(poi);
                    if (fireCntEl) fireCntEl.textContent = `${firesLocked} / 4`;
                    window.soundMgr.playBeep(880, 0.08);

                    if (poi.isFire) {
                        // Nhận diện ĐÚNG đám cháy thật
                        tag.textContent = `🔥 CHÁY (${poi.temp}°C ≥ ${threshold}°C)`;
                        if (fireFx) fireFx.style.display = 'block';
                        correctlyIdentifiedCount++;
                    } else {
                        // BÁO ĐỘNG GIẢ (False Alarm) do ngưỡng thấp hơn nhiệt độ vật thể ấm!
                        tag.textContent = `⚠️ BÁO CHÁY (${poi.temp}°C ≥ ${threshold}°C)`;
                        tag.style.background = 'rgba(255, 23, 68, 0.9)';
                        tag.style.boxShadow = '0 0 10px #ff1744';
                        this.falseAlarms.push(poi);
                    }
                } else {
                    bbox.classList.add('safe-locked');
                    tag.classList.add('tag-safe');
                    safeFiltered++;
                    if (safeCntEl) safeCntEl.textContent = `${safeFiltered} / 4`;
                    window.soundMgr.playBeep(440, 0.05);

                    if (!poi.isFire) {
                        // Nhận diện ĐÚNG vật thể an toàn
                        tag.textContent = `🛡️ AN TOÀN (${poi.temp}°C < ${threshold}°C)`;
                        correctlyIdentifiedCount++;
                    } else {
                        // BỎ SÓT ĐÁM CHÁY (Missed Fire) do ngưỡng cao hơn nhiệt độ đám cháy!
                        tag.textContent = `⚠️ AN TOÀN (${poi.temp}°C < ${threshold}°C)`;
                        tag.style.background = 'rgba(255, 145, 0, 0.25)';
                        tag.style.borderColor = '#ff9100';
                        tag.style.color = '#ffb74d';
                        this.missedFires.push(poi);
                    }
                }

                scannedCount++;
                if (scannedCount === 8) {
                    setTimeout(() => {
                        this.finishAIScanningPhase(correctlyIdentifiedCount, firesLocked, safeFiltered, threshold, acc);
                    }, 400);
                }
            }, 450 + step * 300);
        });
    }

    finishAIScanningPhase(correctCount, firesLocked, safeFiltered, threshold, acc) {
        const summaryTag = document.getElementById('patrol-ai-summary');
        const btnAction = document.getElementById('btn-fire-action');

        const hasErrors = this.falseAlarms.length > 0 || this.missedFires.length > 0;

        if (!hasErrors && correctCount === 8) {
            if (summaryTag) {
                summaryTag.textContent = `✅ AI NHẬN DIỆN CHUẨN XÁC 8/8 VỤ (100%)`;
                summaryTag.style.borderColor = 'var(--neon-green)';
                summaryTag.style.color = 'var(--neon-green)';
            }
            if (btnAction) {
                btnAction.disabled = false;
                btnAction.textContent = '🚨 PHÁT LỆNH ĐỘI CỨU HỎA XUẤT KÍCH';
            }
            window.soundMgr.playAlarm();
            this.setRobotDialogue(
                `Tuyệt vời! Ngưỡng nhiệt ${threshold}°C là ranh giới vàng! Nhận diện chuẩn xác 8/8 mục tiêu! Hãy bấm PHÁT LỆNH ngay!`,
                "alarm"
            );
        } else {
            let errTxt = [];
            if (this.falseAlarms.length > 0) errTxt.push(`${this.falseAlarms.length} báo động giả`);
            if (this.missedFires.length > 0) errTxt.push(`${this.missedFires.length} bỏ sót`);

            if (summaryTag) {
                summaryTag.textContent = `⚠️ AI NHẬN DIỆN ${correctCount}/8 ĐÚNG (${errTxt.join(', ')})`;
                summaryTag.style.borderColor = '#ff1744';
                summaryTag.style.color = '#ff1744';
            }
            if (btnAction) {
                btnAction.disabled = false;
                btnAction.textContent = '🚨 PHÁT LỆNH CỨU HỎA (XEM HẬU QUẢ THỰC ĐỊA)';
            }
            window.soundMgr.playWarning();
            this.setRobotDialogue(
                `CẢNH BÁO! Với ngưỡng ${threshold}°C, AI chỉ nhận diện đúng ${correctCount}/8 vụ (${errTxt.join(', ')}). Hãy bấm PHÁT LỆNH để xem hậu quả!`,
                "warning"
            );
        }
    }

    executeExtinguishOrder() {
        const threshold = typeof this.tempThreshold === 'number' ? this.tempThreshold : 200;
        const acc = this.lastAccuracy !== undefined ? this.lastAccuracy : 99.2;
        const btnAction = document.getElementById('btn-fire-action');
        if (btnAction) {
            btnAction.disabled = true;
            btnAction.textContent = '🚁 TRỰC THĂNG ĐANG XUẤT KÍCH DẬP LỬA...';
        }

        window.soundMgr.playBeep(900, 0.15);
        this.setRobotDialogue(
            "Đã nhận lệnh! Trực thăng cứu hỏa chuyên dụng đang bay đến các tọa độ AI đã khóa mục tiêu!",
            "happy"
        );

        setTimeout(() => window.soundMgr.playHelicopter(), 300);

        const heli = document.getElementById('patrol-heli');
        const targets = this.fireTargets && this.fireTargets.length > 0 ? this.fireTargets : [];

        let targetIdx = 0;
        const flyToNextTarget = () => {
            if (targetIdx >= targets.length) {
                // Đã xả nước xong các mục tiêu AI chỉ định
                setTimeout(() => {
                    // Nếu có đám cháy thật bị AI bỏ sót (do temp < threshold) -> Bùng cháy dữ dội!
                    if (this.missedFires && this.missedFires.length > 0) {
                        this.missedFires.forEach(mPoi => {
                            const mFireFx = document.getElementById(`fire-fx-${mPoi.id}`);
                            const mTag = document.getElementById(`tag-${mPoi.id}`);
                            if (mFireFx) {
                                mFireFx.style.display = 'block';
                                mFireFx.style.animation = 'btnPulse 0.5s infinite alternate';
                            }
                            if (mTag) {
                                mTag.className = 'ai-tag-chip tag-fire';
                                mTag.textContent = `🔥 BỎ SÓT (${mPoi.temp}°C)! LỬA BÙNG LAN!`;
                            }
                        });

                        window.soundMgr.playAlarm();
                        this.setRobotDialogue(
                            `BÁO ĐỘNG ĐỎ! Do đặt ngưỡng quá cao (${threshold}°C), AI đã bỏ sót ${this.missedFires.length} đám cháy rừng khiến lửa bùng phát lan rộng!`,
                            "alarm"
                        );
                    }

                    const hasErrors = this.falseAlarms.length > 0 || this.missedFires.length > 0;

                    if (hasErrors) {
                        setTimeout(() => {
                            window.soundMgr.playWarning();
                            const failModal = document.getElementById('patrol-fail-modal');
                            const badgeEl = document.getElementById('fail-modal-acc-badge');
                            const statsBox = document.getElementById('fail-modal-stats');
                            const hintEl = document.getElementById('fail-modal-hint');

                            if (badgeEl) badgeEl.textContent = `AI ĐẠT ${acc}% (CẦN ≥ 98%)`;

                            if (statsBox) {
                                let items = [];
                                if (this.falseAlarms.length > 0) {
                                    items.push(`<div class="fail-stat-item false-alarm">❌ ${this.falseAlarms.length} Báo động giả (xả nước nhầm)</div>`);
                                }
                                if (this.missedFires.length > 0) {
                                    items.push(`<div class="fail-stat-item missed-fire">🔥 ${this.missedFires.length} Đám cháy bỏ sót (lửa lan)</div>`);
                                }
                                statsBox.innerHTML = items.join('');
                            }

                            if (hintEl) {
                                if (this.falseAlarms.length > 0 && this.missedFires.length === 0) {
                                    hintEl.textContent = '💡 Gợi ý: Ngưỡng nhiệt quá thấp. Hãy tăng lên 180°C – 220°C ở Màn 3.';
                                } else if (this.missedFires.length > 0 && this.falseAlarms.length === 0) {
                                    hintEl.textContent = '💡 Gợi ý: Ngưỡng nhiệt quá cao. Hãy giảm về 180°C – 220°C ở Màn 3.';
                                } else {
                                    hintEl.textContent = '💡 Gợi ý: Chỉnh ngưỡng nhiệt về 180°C – 220°C ở Màn 3.';
                                }
                            }

                            if (failModal) failModal.style.display = 'flex';
                            this.setRobotDialogue(
                                "Nhiệm vụ thất bại! Hãy quay lại Màn 3 điều chỉnh lại ngưỡng nhiệt độ tối ưu nhé!",
                                "warning"
                            );
                        }, 1200);
                    } else {
                        // Thành công tuyệt đối 8/8
                        this.setRobotDialogue(
                            "Xuất sắc! Đã dập tắt toàn bộ 4 đám cháy thật và không lãng phí một giọt nước nào! Rừng nguyên sinh đã an toàn!",
                            "happy"
                        );
                        setTimeout(() => this.showVictoryScreen(), 1800);
                    }
                }, 800);
                return;
            }

            const currentTarget = targets[targetIdx];
            if (heli) {
                heli.style.left = `calc(${currentTarget.x}% - 62px)`;
                heli.style.top = `calc(${currentTarget.y}% - 62px)`;
            }

            setTimeout(() => {
                window.soundMgr.playWaterSplash();
                const targetCard = document.getElementById(currentTarget.id);
                if (targetCard) {
                    const rect = targetCard.getBoundingClientRect();
                    this.particles.spawnWaterStream(
                        rect.left + 35,
                        rect.top + 45,
                        rect.left + 24,
                        rect.top + 24,
                        35
                    );

                    const fireFx = document.getElementById(`fire-fx-${currentTarget.id}`);
                    const tag = document.getElementById(`tag-${currentTarget.id}`);

                    if (currentTarget.isFire) {
                        // Đám cháy thật được dập tắt
                        if (fireFx) fireFx.style.display = 'none';
                        if (tag) {
                            tag.className = 'ai-tag-chip tag-safe';
                            tag.textContent = `✅ ĐÃ DẬP TẮT (${currentTarget.temp}°C)`;
                        }
                    } else {
                        // Báo động giả (ví dụ mái tôn lóa nắng, bãi đá, lò sấy)
                        window.soundMgr.playWarning();
                        if (tag) {
                            tag.className = 'ai-tag-chip';
                            tag.style.background = 'rgba(255, 23, 68, 0.35)';
                            tag.style.borderColor = '#ff1744';
                            tag.style.color = '#ff5252';
                            tag.textContent = `❌ BÁO ĐỘNG GIẢ (${currentTarget.temp}°C)!`;
                        }
                        this.setRobotDialogue(
                            `Trời ơi! Trực thăng xả nước nhầm vào ${currentTarget.title}! Vật thể này ấm ${currentTarget.temp}°C nhưng không hề có cháy!`,
                            "warning"
                        );
                    }
                }

                targetIdx++;
                setTimeout(flyToNextTarget, 1200);
            }, 1200);
        };

        if (targets.length === 0) {
            // Trường hợp người chơi đặt ngưỡng quá cao (> 540°C), không khóa mục tiêu nào!
            flyToNextTarget();
        } else {
            flyToNextTarget();
        }
    }

    // ================= MÀN 5: VINH DANH =================
    showVictoryScreen() {
        this.switchScreen('victory');
        window.soundMgr.playSuccess();
        this.particles.triggerConfetti(160);
        this.setRobotDialogue(
            "Chúc mừng Chỉ huy! Bạn đã xuất sắc bảo vệ trọn vẹn rừng xanh!",
            "happy"
        );
    }

    resetGame() {
        this.stopStage2Timer();
        window.soundMgr.playBeep(520, 0.1);

        // Reset dữ liệu game
        this.collectedPhotos = [];
        this.cleanedPhotos = [];
        this.fireTargets = [];
        this.falseAlarms = [];
        this.missedFires = [];

        // Reset 16 ô ảnh thu thập Màn 1
        for (let i = 1; i <= 16; i++) {
            const slot = document.getElementById(`thumb-${i}`);
            if (slot) {
                slot.innerHTML = '';
                slot.classList.remove('filled');
            }
        }

        // Reset các điểm anomaly trên Quả địa cầu 3D
        if (this.globe && this.globe.anomalies) {
            this.globe.anomalies.forEach(a => {
                a.captured = false;
                a.active = false;
            });
        }

        // Ẩn nút chuyển màn và modal thất bại nếu có
        const btnGotoCleaning = document.getElementById('btn-goto-cleaning');
        if (btnGotoCleaning) btnGotoCleaning.style.display = 'none';

        const failModal = document.getElementById('patrol-fail-modal');
        if (failModal) failModal.style.display = 'none';

        // Chuyển màn hình về Màn 1 và mở Modal Giao nhiệm vụ Chặng 1
        this.switchScreen('s1');
        this.showStageBriefing(1, () => this.startStage1());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new FireSatGame();
});
