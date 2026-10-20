/**
 * TMK BLOCK — GAME XẾP KHỐI GỖ
 * js/storage.js: Quản lý đọc, ghi và bảo vệ dữ liệu LocalStorage (Kỷ lục, Cài đặt, Trạng thái chơi dở).
 */

const STORAGE_KEYS = {
    BEST_SCORE: 'tmk_block_best_score_v1',
    SETTINGS: 'tmk_block_settings_v1',
    GAME_STATE: 'tmk_block_saved_game_v1'
};

class TMKStorage {
    constructor() {
        this.isAvailable = this.checkAvailability();
        this.memoryStore = new Map();
    }

    /**
     * Kiểm tra tính khả dụng của LocalStorage (tránh lỗi trên trình duyệt ẩn danh)
     */
    checkAvailability() {
        try {
            const testKey = '__tmk_test__';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('[TMK Storage] LocalStorage không khả dụng, chuyển sang chế độ lưu tạm trong bộ nhớ.', e);
            return false;
        }
    }

    /**
     * Lấy kỷ lục điểm cao nhất
     * @returns {number}
     */
    getBestScore() {
        if (!this.isAvailable) {
            return this.memoryStore.get(STORAGE_KEYS.BEST_SCORE) || 0;
        }
        try {
            const val = window.localStorage.getItem(STORAGE_KEYS.BEST_SCORE);
            const num = parseInt(val, 10);
            return isNaN(num) || num < 0 ? 0 : num;
        } catch (e) {
            console.error('[TMK Storage] Lỗi đọc Best Score:', e);
            return 0;
        }
    }

    /**
     * Cập nhật kỷ lục điểm cao nhất (chỉ cập nhật khi điểm mới lớn hơn kỷ lục cũ)
     * @param {number} newScore 
     * @returns {boolean} true nếu lập kỷ lục mới
     */
    saveBestScore(newScore) {
        if (typeof newScore !== 'number' || isNaN(newScore) || newScore < 0) return false;
        const currentBest = this.getBestScore();
        if (newScore > currentBest) {
            if (this.isAvailable) {
                try {
                    window.localStorage.setItem(STORAGE_KEYS.BEST_SCORE, newScore.toString());
                } catch (e) {
                    console.error('[TMK Storage] Lỗi lưu Best Score:', e);
                }
            } else {
                this.memoryStore.set(STORAGE_KEYS.BEST_SCORE, newScore);
            }
            return true;
        }
        return false;
    }

    /**
     * Lấy cài đặt người dùng (Âm thanh, Rung, Giao diện)
     */
    getSettings() {
        const defaultSettings = {
            soundEnabled: true,
            volume: 0.7,
            vibration: true
        };

        if (!this.isAvailable) {
            return this.memoryStore.get(STORAGE_KEYS.SETTINGS) || defaultSettings;
        }

        try {
            const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (!raw) return defaultSettings;
            const parsed = JSON.parse(raw);
            return { ...defaultSettings, ...parsed };
        } catch (e) {
            console.error('[TMK Storage] Lỗi đọc Settings:', e);
            return defaultSettings;
        }
    }

    /**
     * Lưu cài đặt người dùng
     */
    saveSettings(settings) {
        const current = this.getSettings();
        const merged = { ...current, ...settings };
        if (this.isAvailable) {
            try {
                window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
            } catch (e) {
                console.error('[TMK Storage] Lỗi lưu Settings:', e);
            }
        } else {
            this.memoryStore.set(STORAGE_KEYS.SETTINGS, merged);
        }
    }

    /**
     * Lưu trạng thái ván chơi đang diễn ra
     */
    saveGameState(state) {
        if (!state) return;
        const serialized = JSON.stringify({
            board: state.board,
            score: state.score,
            combo: state.combo,
            trayPieces: state.trayPieces,
            milestones: state.milestones,
            timestamp: Date.now()
        });

        if (this.isAvailable) {
            try {
                window.localStorage.setItem(STORAGE_KEYS.GAME_STATE, serialized);
            } catch (e) {
                console.error('[TMK Storage] Lỗi lưu Game State:', e);
            }
        } else {
            this.memoryStore.set(STORAGE_KEYS.GAME_STATE, serialized);
        }
    }

    /**
     * Lấy trạng thái ván chơi đang dở (nếu có và hợp lệ)
     */
    getSavedGameState() {
        let raw = null;
        if (this.isAvailable) {
            try {
                raw = window.localStorage.getItem(STORAGE_KEYS.GAME_STATE);
            } catch (e) {
                console.error('[TMK Storage] Lỗi đọc Game State:', e);
            }
        } else {
            raw = this.memoryStore.get(STORAGE_KEYS.GAME_STATE);
        }

        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            // Kiểm tra tính hợp lệ cơ bản của dữ liệu khôi phục
            if (
                data &&
                Array.isArray(data.board) &&
                data.board.length === 8 &&
                data.board.every(row => Array.isArray(row) && row.length === 8) &&
                Number.isFinite(data.score) &&
                data.score >= 0
            ) {
                return data;
            }
            
            return null;
        } catch (e) {
            console.error('[TMK Storage] Dữ liệu Game State không hợp lệ:', e);
            return null;
        }
    }

    /**
     * Xóa ván chơi đã lưu khi game over hoặc người chơi nhấn Chơi Mới
     */
    clearSavedGameState() {
        if (this.isAvailable) {
            try {
                window.localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
            } catch (e) {
                console.error('[TMK Storage] Lỗi xóa Game State:', e);
            }
        } else {
            this.memoryStore.delete(STORAGE_KEYS.GAME_STATE);
        }
    }
}

// Khởi tạo instance duy nhất
window.tmkStorage = new TMKStorage();

