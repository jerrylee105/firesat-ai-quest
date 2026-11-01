// Canvas Particle System cho đồ họa mượt mà 60 FPS
// Hỗ trợ: Sao vũ trụ, Hạt quét radar, Khói bốc, Tia lửa than hồng, Bọt nước cứu hỏa, Pháo hoa giấy Confetti

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.stars = [];
        this.confetti = [];
        this.waterDroplets = [];
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.initStars(80);
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        if (!this.canvas) return;
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    initStars(count = 80) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.02 + 0.005,
                dir: Math.random() > 0.5 ? 1 : -1
            });
        }
    }

    // Hiệu ứng pháo hoa giấy Confetti chiến thắng
    triggerConfetti(count = 120) {
        const colors = ['#00e676', '#00e5ff', '#ffeb3b', '#ff3d00', '#e040fb', '#ffffff'];
        for (let i = 0; i < count; i++) {
            this.confetti.push({
                x: this.width * 0.5 + (Math.random() - 0.5) * 200,
                y: this.height * 0.4,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.9) * 14,
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: Math.random() * 0.008 + 0.004
            });
        }
    }

    // Hiệu ứng tia lửa bập bùng
    spawnFireEmber(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2.5 - 1.0,
                radius: Math.random() * 3.5 + 1.5,
                color: Math.random() > 0.4 ? '#ff5722' : '#ffeb3b',
                alpha: 1.0,
                decay: 0.025
            });
        }
    }

    // Hiệu ứng trực thăng xả nước dập lửa
    spawnWaterStream(startX, startY, targetX, targetY, count = 25) {
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 35;
            this.waterDroplets.push({
                x: startX + spread * 0.3,
                y: startY,
                targetX: targetX + spread,
                targetY: targetY + (Math.random() - 0.5) * 15,
                vx: (targetX + spread - startX) * 0.035,
                vy: (targetY - startY) * 0.035 + Math.random() * 2,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.3 ? '#00e5ff' : '#ffffff',
                alpha: 0.9,
                life: 1.0
            });
        }
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Vẽ sao trời lấp lánh
        for (let star of this.stars) {
            star.alpha += star.speed * star.dir;
            if (star.alpha > 0.9) star.dir = -1;
            if (star.alpha < 0.2) star.dir = 1;

            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fill();
        }

        // 2. Vẽ hạt tia lửa than hồng & khói
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        // 3. Vẽ bọt nước trực thăng cứu hỏa
        for (let i = this.waterDroplets.length - 1; i >= 0; i--) {
            const w = this.waterDroplets[i];
            w.x += w.vx;
            w.y += w.vy;
            w.vy += 0.25; // gravity

            if (w.y >= w.targetY) {
                // Tạo splash nhỏ khi chạm đất
                w.alpha -= 0.1;
            }

            if (w.alpha <= 0 || w.y > this.height) {
                this.waterDroplets.splice(i, 1);
                continue;
            }

            this.ctx.beginPath();
            this.ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
            this.ctx.fillStyle = w.color;
            this.ctx.globalAlpha = w.alpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        // 4. Vẽ Confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.2; // Trọng lực rơi
            c.rotation += c.rotationSpeed;
            c.life -= c.decay;

            if (c.life <= 0 || c.y > this.height) {
                this.confetti.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(c.x, c.y);
            this.ctx.rotate((c.rotation * Math.PI) / 180);
            this.ctx.fillStyle = c.color;
            this.ctx.globalAlpha = c.life;
            this.ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
            this.ctx.restore();
        }

        requestAnimationFrame(this.animate);
    }
}

window.ParticleSystem = ParticleSystem;
