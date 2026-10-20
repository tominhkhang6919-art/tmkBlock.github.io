/**
 * TMK BLOCK — GAME XẾP KHỐI GỖ
 * js/game.js: Bàn chơi 8x8, kiểm tra vị trí, đặt khối, xóa hàng/cột, tính điểm,
 * cơ chế sinh khối thông minh (Lookahead Simulation), độ khó 100K+ và cơ chế cứu trợ minh bạch.
 */

const BOARD_SIZE = 8;

class TMKGame {
    constructor() {
        this.board = this.createEmptyBoard();
        this.score = 0;
        this.combo = 0;
        this.newRecordThisGame = false;
        this.trayPieces = []; // Bộ 3 khối hiện tại trong khay
        this.isGameOver = false;
        this.rescueUsedCount = 0;
        this.milestone100kCelebrated = false;
        this.clearedLinesTotal = 0;

        // Callback hooks để giao diện (UI) lắng nghe và render
        this.onScoreUpdate = null;
        this.onBoardUpdate = null;
        this.onTrayUpdate = null;
        this.onLinesCleared = null;
        this.onGameOver = null;
        this.onMilestone100k = null;
        this.onRescueTriggered = null;
    }

    /**
     * Tạo ma trận bàn cờ 8x8 rỗng
     */
    createEmptyBoard() {
        const board = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            const row = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                row.push(null);
            }
            board.push(row);
        }
        return board;
    }

    /**
     * Khởi động một ván chơi hoàn toàn mới
     */
    newGame() {
        this.board = this.createEmptyBoard();
        this.score = 0;
        this.combo = 0;
        this.newRecordThisGame = false;
        this.isGameOver = false;
        this.rescueUsedCount = 0;
        this.milestone100kCelebrated = false;
        this.clearedLinesTotal = 0;

        window.tmkStorage.clearSavedGameState();

        // Sinh 3 khối mở màn
        this.generateSmartTray();

        if (this.onBoardUpdate) this.onBoardUpdate(this.board);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.combo);
        if (this.onTrayUpdate) this.onTrayUpdate(this.trayPieces);
        this.saveState();
    }

    /**
     * Khôi phục ván chơi từ LocalStorage nếu có
     */
    restoreSavedGame(savedData) {
        if (
            !savedData ||
            !Array.isArray(savedData.board) ||
            savedData.board.length !== BOARD_SIZE ||
            !savedData.board.every(row => Array.isArray(row) && row.length === BOARD_SIZE) ||
            !Number.isFinite(savedData.score) ||
            savedData.score < 0
        ) {
            return false;
        }
        
        const validTray =
            Array.isArray(savedData?.trayPieces) &&
            savedData.trayPieces.length === 3 &&
            savedData.trayPieces.every(piece =>
                piece &&
                typeof piece.id === 'string' &&
                Array.isArray(piece.coords) &&
                piece.coords.length > 0 &&
                Number.isInteger(piece.width) &&
                piece.width > 0 &&
                Number.isInteger(piece.height) &&
                piece.height > 0 &&
                Number.isInteger(piece.size) &&
                piece.size === piece.coords.length &&
                typeof piece.used === 'boolean' &&
                piece.theme &&
                typeof piece.theme.bg === 'string' &&
                piece.coords.every(coord =>
                    Array.isArray(coord) &&
                    coord.length === 2 &&
                    Number.isInteger(coord[0]) &&
                    Number.isInteger(coord[1]) &&
                    coord[0] >= 0 &&
                    coord[0] < piece.width &&
                    coord[1] >= 0 &&
                    coord[1] < piece.height
                )
            );

        if (
            !savedData ||
            !Array.isArray(savedData.board) ||
            savedData.board.length !== BOARD_SIZE ||
            !savedData.board.every(row => Array.isArray(row) && row.length === BOARD_SIZE) ||
            !Number.isFinite(savedData.score) ||
            savedData.score < 0 ||
            !validTray
        ) {
            return false;
        }

        this.board = savedData.board;
        this.score = savedData.score || 0;
        this.newRecordThisGame = savedData.milestones?.newRecordThisGame || false;
        this.combo = savedData.combo || 0;
        this.trayPieces = savedData.trayPieces || [];
        this.isGameOver = false;
        this.milestone100kCelebrated = savedData.milestones?.milestone100k || (this.score >= 100000);
        this.rescueUsedCount = savedData.milestones?.rescueCount || 0;

        // Nếu khay trống, sinh bộ mới
        if (!this.trayPieces || this.trayPieces.every(p => p.used)) {
            this.generateSmartTray();
        }

        if (this.onBoardUpdate) this.onBoardUpdate(this.board);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.combo);
        if (this.onTrayUpdate) this.onTrayUpdate(this.trayPieces);

        return true;
    }

    /**
     * Lưu trạng thái hiện tại vào LocalStorage
     */
    saveState() {
        if (this.isGameOver) return;
        window.tmkStorage.saveGameState({
            board: this.board,
            score: this.score,
            combo: this.combo,
            trayPieces: this.trayPieces,
            milestones: {
                milestone100k: this.milestone100kCelebrated,
                rescueCount: this.rescueUsedCount,
                newRecordThisGame: this.newRecordThisGame
            }
        });
    }

    /**
     * Kiểm tra khối có thể đặt hợp lệ tại tọa độ [startRow, startCol] hay không
     * @param {Object} piece Đối tượng khối
     * @param {number} startRow Hàng bắt đầu (y)
     * @param {number} startCol Cột bắt đầu (x)
     * @param {Array} boardState Ma trận bàn cờ kiểm tra (mặc định bàn hiện tại)
     */
    canPlacePiece(piece, startRow, startCol, boardState = this.board) {
        if (!piece || !piece.coords || piece.used) return false;

        for (let i = 0; i < piece.coords.length; i++) {
            const [dx, dy] = piece.coords[i];
            const r = startRow + dy;
            const c = startCol + dx;

            // Kiểm tra vượt biên 8x8
            if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
                return false;
            }

            // Kiểm tra đè lên ô đã có khối
            if (boardState[r][c] !== null) {
                return false;
            }
        }

        return true;
    }

    /**
     * Lấy danh sách tất cả các vị trí [row, col] hợp lệ để đặt khối
     */
    getValidPositions(piece, boardState = this.board) {
        const valid = [];
        if (!piece || piece.used) return valid;

        for (let r = 0; r <= BOARD_SIZE - piece.height; r++) {
            for (let c = 0; c <= BOARD_SIZE - piece.width; c++) {
                if (this.canPlacePiece(piece, r, c, boardState)) {
                    valid.push([r, c]);
                }
            }
        }
        return valid;
    }

    /**
     * Thực hiện đặt khối vào bàn cờ
     * @param {Object} piece Khối được chọn
     * @param {number} startRow Hàng đặt
     * @param {number} startCol Cột đặt
     */
    placePiece(piece, startRow, startCol) {
        if (!this.canPlacePiece(piece, startRow, startCol)) {
            return { success: false, reason: 'invalid_position' };
        }

        // 1. Ghi nhận các ô vào bàn cờ
        const placedCells = [];
        piece.coords.forEach(([dx, dy]) => {
            const r = startRow + dy;
            const c = startCol + dx;
            this.board[r][c] = {
                pieceId: piece.id,
                theme: piece.theme,
                placedAt: Date.now()
            };
            placedCells.push({ r, c });
        });

        // Đánh dấu khối trong khay đã được sử dụng
        piece.used = true;

        // 2. Tính điểm đặt khối (bằng số ô của khối)
        const pieceScore = piece.size;
        this.addScore(pieceScore);

        // 3. Kiểm tra và thực hiện xóa hàng/cột
        const clearResult = this.checkAndClearLines();

        // 4. Nếu xóa hàng/cột, cộng điểm thưởng và combo
        let earnedPoints = pieceScore;
        if (clearResult.linesCleared > 0) {
            this.combo++;
            this.clearedLinesTotal += clearResult.linesCleared;

            // Công thức điểm xóa đường:
            // 1 dòng = 100, 2 dòng = 300, 3 dòng = 600, 4 dòng = 1000, 5+ = 1000 + (n-4)*500
            let lineBaseScore = 0;
            switch (clearResult.linesCleared) {
                case 1: lineBaseScore = 100; break;
                case 2: lineBaseScore = 300; break;
                case 3: lineBaseScore = 600; break;
                case 4: lineBaseScore = 1000; break;
                default: lineBaseScore = 1000 + (clearResult.linesCleared - 4) * 500; break;
            }

            // Thưởng combo: mỗi bậc combo sau bậc 1 cộng thêm 60 điểm
            const comboBonus = this.combo > 1 ? (this.combo - 1) * 60 : 0;
            const totalLineScore = lineBaseScore + comboBonus;

            this.addScore(totalLineScore);
            earnedPoints += totalLineScore;

            if (this.onLinesCleared) {
                this.onLinesCleared({
                    linesCount: clearResult.linesCleared,
                    rows: clearResult.rows,
                    cols: clearResult.cols,
                    clearedCells: clearResult.uniqueClearedCells,
                    combo: this.combo,
                    scoreEarned: totalLineScore
                });
            }
        } else {
            // Không xóa được dòng nào -> đặt lại combo về 0
            this.combo = 0;
        }

        // Cập nhật giao diện bàn cờ & điểm
        if (this.onBoardUpdate) this.onBoardUpdate(this.board);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.combo, earnedPoints);

        // 5. Kiểm tra nếu cả 3 khối đều đã dùng hết -> sinh bộ 3 khối mới
        const allUsed = this.trayPieces.every(p => p.used);
        if (allUsed) {
            this.generateSmartTray();
        }

        if (this.onTrayUpdate) this.onTrayUpdate(this.trayPieces);

        // 6. Kiểm tra điều kiện nước đi tiếp theo & cơ chế cứu trợ
        this.verifyGameContinuation();

        // 7. Lưu trạng thái
        this.saveState();

        return {
            success: true,
            placedCells,
            clearResult,
            earnedPoints,
            combo: this.combo
        };
    }

    /**
     * Quét và xóa tất cả hàng/cột đã kín
     * Các ô giao nhau giữa hàng và cột chỉ tính xóa 1 lần duy nhất
     */
    checkAndClearLines() {
        const fullRows = [];
        const fullCols = [];

        // Tìm các hàng kín 8 ô
        for (let r = 0; r < BOARD_SIZE; r++) {
            let rowFull = true;
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.board[r][c] === null) {
                    rowFull = false;
                    break;
                }
            }
            if (rowFull) fullRows.push(r);
        }

        // Tìm các cột kín 8 ô
        for (let c = 0; c < BOARD_SIZE; c++) {
            let colFull = true;
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (this.board[r][c] === null) {
                    colFull = false;
                    break;
                }
            }
            if (colFull) fullCols.push(c);
        }

        const linesCleared = fullRows.length + fullCols.length;
        const uniqueClearedCells = [];
        const cellSet = new Set();

        if (linesCleared > 0) {
            // Tập hợp ô thuộc hàng bị xóa
            fullRows.forEach(r => {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const key = `${r},${c}`;
                    if (!cellSet.has(key)) {
                        cellSet.add(key);
                        uniqueClearedCells.push({ r, c, cellData: this.board[r][c] });
                    }
                }
            });

            // Tập hợp ô thuộc cột bị xóa (tự động loại trừ ô giao nhau đã thêm)
            fullCols.forEach(c => {
                for (let r = 0; r < BOARD_SIZE; r++) {
                    const key = `${r},${c}`;
                    if (!cellSet.has(key)) {
                        cellSet.add(key);
                        uniqueClearedCells.push({ r, c, cellData: this.board[r][c] });
                    }
                }
            });

            // Làm trống các ô trên ma trận bàn cờ
            uniqueClearedCells.forEach(({ r, c }) => {
                this.board[r][c] = null;
            });
        }

        return {
            linesCleared,
            rows: fullRows,
            cols: fullCols,
            uniqueClearedCells
        };
    }

    /**
     * Cộng điểm an toàn, kiểm tra mốc 100.000 điểm và kỷ lục
     */
    addScore(amount) {
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return;
        this.score += amount;

        // Kiểm tra mốc 100.000 điểm lần đầu tiên
        if (this.score >= 100000 && !this.milestone100kCelebrated) {
            this.milestone100kCelebrated = true;
            if (this.onMilestone100k) {
                this.onMilestone100k(this.score);
            }
        }

        // Lưu kỷ lục cá nhân nếu vượt qua kỷ lục cũ
        if (this.score > window.tmkStorage.getBestScore()) {
            this.newRecordThisGame = true;
            window.tmkStorage.saveBestScore(this.score);
        }
    }

    /**
     * Tính tỷ lệ chiếm chỗ trên bàn cờ (0.0 -> 1.0)
     */
    getBoardDensity(boardState = this.board) {
        let occupied = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (boardState[r][c] !== null) occupied++;
            }
        }
        return occupied / (BOARD_SIZE * BOARD_SIZE);
    }

    /**
     * Sao chép sâu ma trận bàn cờ phục vụ mô phỏng lookahead
     */
    cloneBoard(boardState = this.board) {
        return boardState.map(row => row.map(cell => (cell ? { ...cell } : null)));
    }

    /**
     * Mô phỏng đặt một khối lên ma trận bàn cờ giả lập và xóa hàng/cột nếu có
     */
    simulatePlacement(boardState, piece, r, c) {
        const nextBoard = this.cloneBoard(boardState);
        piece.coords.forEach(([dx, dy]) => {
            nextBoard[r + dy][c + dx] = { pieceId: piece.id };
        });

        // Xóa hàng kín
        for (let row = 0; row < BOARD_SIZE; row++) {
            if (nextBoard[row].every(cell => cell !== null)) {
                for (let col = 0; col < BOARD_SIZE; col++) nextBoard[row][col] = null;
            }
        }

        // Xóa cột kín
        for (let col = 0; col < BOARD_SIZE; col++) {
            let colFull = true;
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (nextBoard[row][col] === null) {
                    colFull = false;
                    break;
                }
            }
            if (colFull) {
                for (let row = 0; row < BOARD_SIZE; row++) nextBoard[row][col] = null;
            }
        }

        return nextBoard;
    }

    /**
     * THUẬT TOÁN SINH KHỐI THÔNG MINH (Lookahead & Playability Optimization)
     * Đảm bảo luôn tạo ra bộ 3 khối có ít nhất một cơ hội đặt hợp lệ và hướng tới xóa đường.
     */
    generateSmartTray() {
        const density = this.getBoardDensity();
        const candidateSets = [];
        const ATTEMPTS = 12; // Thử nghiệm 12 bộ khối ứng viên để chọn bộ tối ưu nhất

        for (let i = 0; i < ATTEMPTS; i++) {
            const candidatePieces = [];
            for (let j = 0; j < 3; j++) {
                // Nếu bàn chơi chật chội (> 65% ô kín), ưu tiên khối Tier 1 & 2
                let piece;
                if (density > 0.65) {
                    const smallPieces = window.TMK_PIECES.getPiecesByTier(1);
                    piece = window.TMK_PIECES.clonePiece(smallPieces[Math.floor(Math.random() * smallPieces.length)]);
                } else {
                    piece = window.TMK_PIECES.getRandomPieceTemplate(this.score);
                }
                candidatePieces.push(piece);
            }

            // Đánh giá bộ 3 ứng viên
            const evalResult = this.evaluatePieceSet(candidatePieces);
            candidateSets.push({
                pieces: candidatePieces,
                score: evalResult.score,
                playableCount: evalResult.playableCount,
                canClearLine: evalResult.canClearLine
            });

            // Nếu tìm thấy một bộ xuất sắc (cả 3 khối đều chơi được và có thể xóa đường), chọn ngay
            if (evalResult.playableCount === 3 && evalResult.canClearLine) {
                this.trayPieces = candidatePieces;
                return;
            }
        }

        // Sắp xếp các bộ ứng viên theo điểm đánh giá giảm dần
        candidateSets.sort((a, b) => b.score - a.score);

        // Chọn bộ ứng viên có điểm số tốt nhất
        if (candidateSets.length > 0 && candidateSets[0].playableCount > 0) {
            this.trayPieces = candidateSets[0].pieces;
        } else {
            // Trường hợp dự phòng khẩn cấp: Sinh các khối đơn 1x1 và thanh nhỏ 1x2 để người chơi chắc chắn đặt được
            const emergencyPieces = [
                window.TMK_PIECES.clonePiece(window.TMK_PIECES.PIECES_MAP.get('dot_1x1')),
                window.TMK_PIECES.clonePiece(window.TMK_PIECES.PIECES_MAP.get('line_2h')),
                window.TMK_PIECES.clonePiece(window.TMK_PIECES.PIECES_MAP.get('dot_1x1'))
            ];
            this.trayPieces = emergencyPieces;
        }
    }

    /**
     * Đánh giá chất lượng của một bộ 3 khối ứng viên dựa trên mô phỏng
     */
    evaluatePieceSet(pieces) {
        let score = 0;
        let playableCount = 0;
        let canClearLine = false;

        // 1. Kiểm tra từng khối trên bàn hiện tại
        pieces.forEach(piece => {
            const valids = this.getValidPositions(piece, this.board);
            if (valids.length > 0) {
                playableCount++;
                score += 100 + valids.length * 2;
            }
        });

        // 2. Mô phỏng đặt tuần tự để xem có cơ hội xóa đường hay không
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i];
            const valids = this.getValidPositions(piece, this.board);

            for (let v = 0; v < Math.min(5, valids.length); v++) {
                const [r, c] = valids[v];
                const simulatedBoard = this.simulatePlacement(this.board, piece, r, c);
                const densityBefore = this.getBoardDensity(this.board);
                const densityAfter = this.getBoardDensity(simulatedBoard);

                // Nếu sau khi đặt khối mà mật độ giảm (chứng tỏ đã xóa ít nhất một dòng)
                if (densityAfter < densityBefore) {
                    canClearLine = true;
                    score += 300;
                    break;
                }
            }
            if (canClearLine) break;
        }

        // Ưu tiên cao cho bộ khối có thể đặt được cả 3
        if (playableCount === 3) score += 500;
        else if (playableCount === 2) score += 200;

        return { score, playableCount, canClearLine };
    }

    /**
     * Kiểm tra khả năng tiếp tục ván chơi và kích hoạt CƠ CHẾ CỨU TRỢ MINH BẠCH nếu cần
     */
    verifyGameContinuation() {
        const remainingPieces = this.trayPieces.filter(p => !p.used);
        if (remainingPieces.length === 0) return;

        // Kiểm tra xem có khối nào trong khay còn vị trí đặt hợp lệ không
        const hasValidMove = remainingPieces.some(piece => {
            return this.getValidPositions(piece, this.board).length > 0;
        });

        if (hasValidMove) {
            // Vẫn còn ít nhất một nước đi hợp lệ -> tiếp tục chơi bình thường
            return;
        }

        // Bế tắc: Không có bất kỳ khối nào đặt vừa bàn cờ hiện tại
        // Kích hoạt CƠ CHẾ CỨU TRỢ (Rescue Mechanic)
        const rescueSuccess = this.triggerRescueMechanic();
        const hasValidMoveAfterRescue = this.trayPieces.some(piece =>
            !piece.used && this.getValidPositions(piece, this.board).length > 0
        );

        if (rescueSuccess && hasValidMoveAfterRescue) {
            return;
        }

        // Cứu trợ không thành công nếu vẫn không có nước đi hợp lệ.
        this.isGameOver = true;
        window.tmkStorage.clearSavedGameState();
            if (this.onGameOver) {
                this.onGameOver({
                    finalScore: this.score,
                    bestScore: window.tmkStorage.getBestScore(),
                    isNewRecord: this.newRecordThisGame
                });
            }
    }

    /**
     * CƠ CHẾ CỨU TRỢ MINH BẠCH (Rescue Mechanic)
     * Giải phóng 1 hàng hoặc cột đông đúc nhất kèm hiệu ứng âm thanh & thông báo rõ ràng cho người chơi.
     */
    triggerRescueMechanic() {
        if (this.rescueUsedCount >= 5) return false;
            this.rescueUsedCount++;
            
        this.rescueUsedCount++;

        // Tìm hàng có nhiều ô bị chiếm nhất để giải phóng
        let maxOccupiedInRow = -1;
        let bestRowToClear = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
            let occupied = 0;
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.board[r][c] !== null) occupied++;
            }
            if (occupied > maxOccupiedInRow) {
                maxOccupiedInRow = occupied;
                bestRowToClear = r;
            }
        }

        // Nếu bàn cờ hoàn toàn rỗng (rất hiếm), không cần cứu
        if (maxOccupiedInRow === 0) return false;

        // Giải phóng hàng được chọn
        const clearedCells = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (this.board[bestRowToClear][c] !== null) {
                clearedCells.push({ r: bestRowToClear, c, cellData: this.board[bestRowToClear][c] });
                this.board[bestRowToClear][c] = null;
            }
        }

        // Báo cho UI kích hoạt animation cứu trợ và thông báo toast
        if (this.onRescueTriggered) {
            this.onRescueTriggered({
                type: 'row',
                index: bestRowToClear,
                clearedCells,
                message: `CỨU TRỢ TỰ ĐỘNG: ĐÃ GIẢI PHÓNG HÀNG ${bestRowToClear + 1} ĐỂ TIẾP TỤC!`
            });
        }

        if (this.onBoardUpdate) this.onBoardUpdate(this.board);

        // Kiểm tra lại sau khi cứu trợ xem đã có nước đi chưa
        const remainingPieces = this.trayPieces.filter(p => !p.used);
        const canMoveNow = remainingPieces.some(piece => {
            return this.getValidPositions(piece, this.board).length > 0;
        });

        // Nếu giải phóng 1 hàng vẫn chưa đủ (ví dụ cần chỗ cho khối lớn 3x3), giải phóng thêm 1 cột giao nhau
        if (!canMoveNow) {
            let bestColToClear = 3; // Mặc định cột trung tâm
            for (let c = 0; c < BOARD_SIZE; c++) {
                this.board[bestRowToClear][c] = null;
            }
            for (let r = 0; r < BOARD_SIZE; r++) {
                this.board[r][bestColToClear] = null;
            }
            if (this.onBoardUpdate) this.onBoardUpdate(this.board);
        }

        return true;
    }
}

// Khởi tạo instance toàn cục
window.tmkGame = new TMKGame();

