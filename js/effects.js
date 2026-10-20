/**
 * TMK BLOCK — GAME XẾP KHỐI GỖ
 * js/effects.js: Hiệu ứng âm thanh tổng hợp Web Audio API (100% offline) và hiệu ứng hình ảnh (hạt gỗ, rung màn hình, điểm bay, hào quang).
 */

class TMKEffects {
    constructor() {
        this.audioCtx = null;
        this.soundEnabled = true;
        this.volume = 0.7;
        this.initAudio();
        this.particleContainer = null;
    }

    /**
     * Khởi tạo Web Audio Context an toàn sau cử chỉ người dùng
     */
    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn('[TMK Effects] Web Audio API không được hỗ trợ:', e);
        }
    }

    ensureAudioContext() {
        if (!this.audioCtx) {
            this.initAudio();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = !!enabled;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // ==========================================
    // ÂM THANH TỔNG HỢP (SYNTHESIZED AUDIO)
    // ==========================================

    /**
     * Âm thanh gõ gỗ nhẹ khi chạm / nhấc khối
     */
    playTap() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Âm thanh đập khối gỗ ấm áp vào bàn cờ
     */
    playPlace() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Âm bổng mộc
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gain1.gain.setValueAtTime(0.4 * this.volume, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        // Âm đục trầm mô phỏng tiếng gỗ đặc
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(120, now);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        gain2.gain.setValueAtTime(0.3 * this.volume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.12);
        osc2.stop(now + 0.12);
    }

    /**
     * Âm thanh xóa hàng / cột với hợp âm mộc mạc và vang
     */
    playLineClear(lineCount = 1, combo = 0) {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        // Tần số nốt nhạc theo bậc ngũ cung / trưởng (C, E, G, A, C)
        const baseFreqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        const pitchShift = Math.min(12, combo * 2);
        const pitchMultiplier = Math.pow(1.05946, pitchShift);

        const chordCount = Math.min(baseFreqs.length, 2 + lineCount);
        for (let i = 0; i < chordCount; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = i % 2 === 0 ? 'triangle' : 'sine';
            const freq = baseFreqs[i] * pitchMultiplier;
            const startTime = now + i * 0.04;
            const duration = 0.35 + lineCount * 0.08;

            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.01, startTime + duration);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime((0.25 / chordCount) * this.volume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        }
    }

    /**
     * Âm thanh lập kỷ lục mới (Fanfare rộn rã)
     */
    playHighScore() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        // Chuỗi nốt chiến thắng: C4, E4, G4, C5, G4, C5
        const melody = [523.25, 659.25, 783.99, 1046.50];
        melody.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const startTime = now + idx * 0.12;
            const duration = 0.3;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.3 * this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }

    /**
     * Âm thanh vượt mốc 100.000 điểm
     */
    playMilestone100k() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const chords = [
            [523.25, 659.25, 783.99],
            [587.33, 739.99, 880.00],
            [659.25, 830.61, 987.77],
            [1046.50, 1318.51, 1567.98]
        ];

        chords.forEach((chord, step) => {
            const startTime = now + step * 0.2;
            chord.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.18 * this.volume, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.35);
            });
        });
    }

    /**
     * Âm thanh cơ chế cứu trợ kích hoạt
     */
    playRescue() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    /**
     * Âm thanh kết thúc ván chơi (Game Over)
     */
    playGameOver() {
        if (!this.soundEnabled || !this.audioCtx) return;
        this.ensureAudioContext();

        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const notes = [392.00, 349.23, 311.13, 261.63];

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = now + idx * 0.16;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25 * this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // ==========================================
    // HIỆU ỨNG HÌNH ẢNH (VISUAL EFFECTS)
    // ==========================================

    /**
     * Hiển thị điểm bay + cộng dồn
     * @param {number} x Tọa độ X trên màn hình
     * @param {number} y Tọa độ Y trên màn hình
     * @param {string|number} text Nội dung hiển thị (vd: +120, COMBO x2)
     * @param {string} type 'normal' | 'combo' | 'record'
     */
    showFloatingScore(x, y, text, type = 'normal') {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-score-tag ${type}`;
        floatEl.innerText = text;

        // Vị trí xuất phát
        floatEl.style.left = `${x}px`;
        floatEl.style.top = `${y}px`;

        document.body.appendChild(floatEl);

        // Tự hủy sau khi kết thúc animation
        setTimeout(() => {
            if (floatEl.parentNode) {
                floatEl.parentNode.removeChild(floatEl);
            }
        }, 900);
    }

    /**
     * Rung nhẹ bàn cờ khi xóa nhiều hàng cùng lúc
     * @param {HTMLElement} element 
     * @param {number} intensity Mức độ rung (1 - 3)
     */
    shakeBoard(element, intensity = 1) {
        if (!element) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        element.classList.remove('shake-sm', 'shake-md', 'shake-lg');
        const className = intensity > 2 ? 'shake-lg' : intensity === 2 ? 'shake-md' : 'shake-sm';
        
        // Buộc reflow để kích hoạt lại animation
        void element.offsetWidth;
        element.classList.add(className);

        setTimeout(() => {
            element.classList.remove(className);
        }, 400);
    }

    /**
     * Bắn hạt gỗ và ánh kim tại các ô bị xóa
     * @param {Array<{x: number, y: number, color: string}>} clearedPositions Danh sách vị trí ô
     */
    spawnWoodSparks(clearedPositions = []) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (!this.particleContainer) {
            this.particleContainer = document.getElementById('particles-overlay');
        }
        if (!this.particleContainer) return;

        clearedPositions.forEach(pos => {
            const particleCount = 6;
            for (let i = 0; i < particleCount; i++) {
                const p = document.createElement('div');
                p.className = 'wood-spark';
                
                const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
                const distance = 25 + Math.random() * 35;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                p.style.left = `${pos.x}px`;
                p.style.top = `${pos.y}px`;
                p.style.setProperty('--tx', `${tx}px`);
                p.style.setProperty('--ty', `${ty}px`);
                p.style.backgroundColor = pos.color || '#e4a853';

                this.particleContainer.appendChild(p);

                setTimeout(() => {
                    if (p.parentNode) p.parentNode.removeChild(p);
                }, 600);
            }
        });
    }

    /**
     * Bắn pháo giấy chúc mừng khi lập kỷ lục mới hoặc đạt 100k
     */
    triggerConfetti() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (!this.particleContainer) {
            this.particleContainer = document.getElementById('particles-overlay');
        }
        if (!this.particleContainer) return;

        const colors = ['#e4a853', '#d9822b', '#fae092', '#bc75a1', '#7ec4ad', '#4d8f78', '#fff'];
        const count = 40;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}vw`;
            piece.style.top = `-20px`;
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            piece.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;

            this.particleContainer.appendChild(piece);

            setTimeout(() => {
                if (piece.parentNode) piece.parentNode.removeChild(piece);
            }, 3000);
        }
    }
}

// Khởi tạo instance duy nhất
window.tmkEffects = new TMKEffects();

