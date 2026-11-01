// Web Audio API Procedural Synthesizer for FireSat AI Quest
// Zero external audio files, 100% lightweight & instantaneous playback

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgmOsc1 = null;
        this.bgmOsc2 = null;
        this.bgmGain = null;
        this.isBgmPlaying = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted && this.bgmGain) {
            this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } else if (!this.muted && this.bgmGain && this.isBgmPlaying) {
            this.bgmGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        }
        return this.muted;
    }

    // Tiếng Click / Beep nhẹ
    playBeep(freq = 600, duration = 0.08, type = 'sine') {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Tiếng "Tách" chụp ảnh vệ tinh
    playShutter() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Cú click cơ học thứ 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(150, now + 0.06);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.06);

        // Cú trập màn hình thứ 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1200, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.14);
        gain2.gain.setValueAtTime(0.25, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.14);
    }

    // Tiếng Robot AI đúng / Thành công
    playSuccess() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0.18, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.2);
        });
    }

    // Tiếng Robot nhắc nhở khi chọn sai (dịu dàng, không chói tai)
    playWarning() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(210, now + 0.22);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    // Tiếng mạng Nơ-ron huấn luyện AI nhấp nháy
    playComputeTick() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const freq = 1200 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Còi báo động khẩn cấp khi phát hiện lửa 5mx5m
    playAlarm() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.linearRampToValueAtTime(550, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Tiếng cánh quạt trực thăng cứu hỏa dập lửa
    playHelicopter() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        // Chuỗi nhịp quạt phành phạch
        for (let i = 0; i < 8; i++) {
            const time = now + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(90, time);
            osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
            gain.gain.setValueAtTime(0.28, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.08);
        }
    }

    // Tiếng phun nước xèo xèo dập lửa
    playWaterSplash() {
        if (this.muted) return;
        this.init();
        const bufferSize = this.ctx.sampleRate * 1.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // White noise
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 1.2);
        filter.Q.value = 3;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + 1.2);
    }

    // Nhạc nền Sci-Fi Không gian nhẹ nhàng (Ambient Lo-fi)
    startBGM() {
        if (this.isBgmPlaying || !this.ctx) return;
        this.init();
        this.isBgmPlaying = true;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.muted ? 0 : 0.035, this.ctx.currentTime);
        this.bgmGain.connect(this.ctx.destination);

        const chordNotes = [
            [220, 261.63, 329.63], // Am
            [174.61, 220, 261.63], // F
            [196, 246.94, 293.66], // G
            [164.81, 196, 246.94]  // Em
        ];
        let chordIdx = 0;

        const playNextChord = () => {
            if (!this.isBgmPlaying) return;
            const now = this.ctx.currentTime;
            const notes = chordNotes[chordIdx];
            chordIdx = (chordIdx + 1) % chordNotes.length;

            notes.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.3, now + 1.2);
                gain.gain.linearRampToValueAtTime(0.001, now + 3.8);

                osc.connect(gain);
                gain.connect(this.bgmGain);
                osc.start(now);
                osc.stop(now + 4.0);
            });

            this.bgmTimeout = setTimeout(playNextChord, 3600);
        };

        playNextChord();
    }

    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
    }
}

window.soundMgr = new SoundManager();
