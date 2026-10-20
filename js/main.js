/**
 * TMK BLOCK — GAME XẾP KHỐI GỖ
 * js/main.js: Khởi tạo ứng dụng, quản lý màn hình, sự kiện kéo thả (Desktop & Mobile),
 * chạm chọn - chạm đặt, kết nối giao diện với engine game và âm thanh.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. CÁC PHẦN TỬ GIAO DIỆN CHÍNH (DOM ELEMENTS)
    // ==========================================
    const splashScreen = document.getElementById('splash-screen');
    const gameScreen = document.getElementById('game-screen');
    const btnStartGame = document.getElementById('btn-start-game');
    const btnSplashResume = document.getElementById('btn-splash-resume');
    const splashBestScore = document.getElementById('splash-best-score');
    const btnHomeQuick = document.getElementById('btn-home-quick');

    const currentScoreEl = document.getElementById('current-score');
    const bestScoreEl = document.getElementById('best-score');
    const comboBadge = document.getElementById('combo-badge');
    const comboText = document.getElementById('combo-text');
    const stageBadge = document.getElementById('stage-badge');
    const stageText = document.getElementById('stage-text');

    const gameBoardEl = document.getElementById('game-board');
    const boardGhostOverlay = document.getElementById('board-ghost-overlay');
    const piecesTrayEl = document.getElementById('pieces-tray');
    const traySlots = [
        document.getElementById('tray-slot-0'),
        document.getElementById('tray-slot-1'),
        document.getElementById('tray-slot-2')
    ];

    // Các nút điều khiển trên thanh tiêu đề
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');
    const btnRestartGame = document.getElementById('btn-restart-game');
    const btnOpenSettings = document.getElementById('btn-open-settings');

    // Các Modal & Toast
    const modalConfirmRestart = document.getElementById('modal-confirm-restart');
    const btnConfirmRestartYes = document.getElementById('btn-confirm-restart-yes');
    const btnConfirmRestartNo = document.getElementById('btn-confirm-restart-no');

    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSettingsCloseOk = document.getElementById('btn-settings-close-ok');
    const settingSoundToggle = document.getElementById('setting-sound-toggle');

    const modalGameover = document.getElementById('modal-gameover');
    const gameoverIcon = document.getElementById('gameover-icon');
    const newRecordAlert = document.getElementById('new-record-alert');
    const finalScoreEl = document.getElementById('final-score');
    const finalBestEl = document.getElementById('final-best');
    const btnGameoverReplay = document.getElementById('btn-gameover-replay');
    const btnGameoverHome = document.getElementById('btn-gameover-home');

    const modalMilestone100k = document.getElementById('modal-milestone-100k');
    const btnCloseMilestone = document.getElementById('btn-close-milestone');

    const rescueToast = document.getElementById('rescue-toast');
    const rescueDesc = document.getElementById('rescue-desc');

    // ==========================================
    // 2. TRẠNG THÁI TƯƠNG TÁC (INTERACTION STATE)
    // ==========================================
    let selectedSlotIndex = null; // Khối được chọn bằng thao tác chạm (Mobile/Click)
    let isDragging = false;
    let dragYOffset = 30;
    let highlightedCells = [];
    let dragFrameId = 0;
    let pendingDragPoint = null;
    let activeDragSlotIndex = null;
    let draggedGhostEl = null;
    let currentHoverCell = null; // { row, col }
    let rescueToastTimer = null;
    let activePointerId = null;
    let dragLayout = null;
    // ==========================================
    // 3. KHỞI TẠO BÀN CỜ 8x8 TRÊN DOM
    // ==========================================
    const cellElements = []; // Ma trận phần tử DOM [r][c]

    function initBoardDOM() {
        gameBoardEl.innerHTML = '';
        cellElements.length = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
            const rowEls = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                gameBoardEl.appendChild(cell);
                rowEls.push(cell);

                // Hỗ trợ người dùng nhấp trực tiếp vào ô để đặt khối đã chọn
                cell.addEventListener('click', () => handleCellClick(r, c));
            }
            cellElements.push(rowEls);
        }
    }

    // ==========================================
    // 4. CẬP NHẬT GIAO DIỆN BÀN CỜ & ĐIỂM
    // ==========================================
    function renderBoard(board) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cellData = board[r][c];
                const cellEl = cellElements[r][c];
                cellEl.innerHTML = '';
                cellEl.classList.remove('ghost-valid');

                if (cellData) {
                    const tile = document.createElement('div');
                    tile.className = 'wood-tile';
                    if (cellData.theme && cellData.theme.bg) {
                        tile.style.background = cellData.theme.bg;
                    } else {
                        tile.style.background = 'linear-gradient(135deg, #e4a853, #c27d28)';
                    }
                    cellEl.appendChild(tile);
                }
            }
        }
    }

    function renderScores(score, combo, earned = 0) {
        currentScoreEl.innerText = score.toLocaleString('vi-VN');
        const best = window.tmkStorage.getBestScore();
        bestScoreEl.innerText = best.toLocaleString('vi-VN');
        splashBestScore.innerText = best.toLocaleString('vi-VN');

        // Hiển thị huy hiệu Combo
        if (combo > 1) {
            comboBadge.classList.remove('hidden');
            comboText.innerText = `COMBO x${combo}`;
        } else {
            comboBadge.classList.add('hidden');
        }

        // Cập nhật nhãn giai đoạn độ khó
        if (score >= 100000) {
            stageBadge.classList.add('hard-mode');
            const step = Math.floor((score - 100000) / 50000) + 1;
            stageText.innerText = `THỬ THÁCH 100K+ (CẤP ${step})`;
        } else {
            stageBadge.classList.remove('hard-mode');
            stageText.innerText = 'GIAI ĐOẠN: THƯ THÁI';
        }

        // Hiệu ứng nảy nhẹ số điểm khi có điểm mới
        if (earned > 0) {
            currentScoreEl.style.transform = 'scale(1.25)';
            setTimeout(() => {
                currentScoreEl.style.transform = 'scale(1)';
            }, 180);
        }
    }

    // ==========================================
    // 5. HIỂN THỊ KHAY 3 KHỐI LỰA CHỌN (TRAY)
    // ==========================================
    function renderTray(trayPieces) {
        trayPieces.forEach((piece, slotIdx) => {
            const slotEl = traySlots[slotIdx];
            slotEl.innerHTML = '';
            slotEl.classList.remove('selected', 'empty');

            if (!piece || piece.used) {
                slotEl.classList.add('empty');
                if (selectedSlotIndex === slotIdx) {
                    selectedSlotIndex = null;
                }
                return;
            }

            if (selectedSlotIndex === slotIdx) {
                slotEl.classList.add('selected');
            }

            // Tạo khung hiển thị khối gỗ
            const pieceView = document.createElement('div');
            pieceView.className = 'piece-view';

            // Kích thước ô trong khay (tự co giãn nếu khối lớn)
            const maxDim = Math.max(piece.width, piece.height);
            let tileSize = 24;
            if (maxDim >= 4) tileSize = 17;
            else if (maxDim === 3) tileSize = 20;

            pieceView.style.gridTemplateColumns = `repeat(${piece.width}, ${tileSize}px)`;
            pieceView.style.gridTemplateRows = `repeat(${piece.height}, ${tileSize}px)`;

            // Tạo các ô con
            for (let r = 0; r < piece.height; r++) {
                for (let c = 0; c < piece.width; c++) {
                    const isOccupied = piece.coords.some(([x, y]) => x === c && y === r);
                    const tile = document.createElement('div');
                    if (isOccupied) {
                        tile.className = 'preview-tile';
                        tile.style.background = piece.theme.bg;
                    } else {
                        tile.style.visibility = 'hidden';
                    }
                    pieceView.appendChild(tile);
                }
            }

            slotEl.appendChild(pieceView);
        });
    }

    // ==========================================
    // 6. XỬ LÝ KÉO THẢ (DRAG & DROP - MOUSE & TOUCH)
    // ==========================================
    function startDrag(slotIdx, clientX, clientY, pointerType = 'mouse') {
        const piece = window.tmkGame.trayPieces[slotIdx];
        if (!piece || piece.used) return;

        dragYOffset = pointerType === 'touch' ? 55 : 30;

        isDragging = true;
        activeDragSlotIndex = slotIdx;
        selectedSlotIndex = slotIdx;
        document.body.classList.add('is-dragging');

        traySlots.forEach((slot, index) => {
            slot.classList.toggle('selected', index === slotIdx);
        });

        window.tmkEffects.playTap();

        if (draggedGhostEl?.parentNode) {
            draggedGhostEl.parentNode.removeChild(draggedGhostEl);
        }

        draggedGhostEl = document.createElement('div');
        draggedGhostEl.className = 'dragged-piece-ghost';

        const firstCell = cellElements[0][0].getBoundingClientRect();
        const nextColumn = cellElements[0][1].getBoundingClientRect();
        const nextRow = cellElements[1][0].getBoundingClientRect();
        const boardStyle = getComputedStyle(gameBoardEl);
        const gap = parseFloat(boardStyle.columnGap) || 0;
        const cellSize = firstCell.width;

        dragLayout = {
            boardLeft: firstCell.left,
            boardTop: firstCell.top,
            columnPitch: nextColumn.left - firstCell.left,
            rowPitch: nextRow.top - firstCell.top,
            ghostWidth: piece.width * cellSize + (piece.width - 1) * gap,
            ghostHeight: piece.height * cellSize + (piece.height - 1) * gap,
            ghostLeft: 0,
            ghostTop: 0
        };

        draggedGhostEl.style.gridTemplateColumns =
            `repeat(${piece.width}, ${cellSize}px)`;
        draggedGhostEl.style.gridTemplateRows =
            `repeat(${piece.height}, ${cellSize}px)`;
        draggedGhostEl.style.gap = `${gap}px`;

        for (let r = 0; r < piece.height; r++) {
            for (let c = 0; c < piece.width; c++) {
                const isOccupied = piece.coords.some(([x, y]) => x === c && y === r);
                const tile = document.createElement('div');

                if (isOccupied) {
                    tile.className = 'preview-tile';
                    tile.style.background = piece.theme.bg;
                } else {
                    tile.style.visibility = 'hidden';
                }

                draggedGhostEl.appendChild(tile);
            }
        }

        document.body.appendChild(draggedGhostEl);
        updateGhostPosition(clientX, clientY);
    }

    function updateGhostPosition(clientX, clientY) {
        if (!draggedGhostEl || !dragLayout) return;

        dragLayout.ghostLeft = clientX - dragLayout.ghostWidth / 2;
        dragLayout.ghostTop =
            clientY - dragYOffset - dragLayout.ghostHeight * 0.6;

        draggedGhostEl.style.transform =
            `translate3d(${dragLayout.ghostLeft}px, ${dragLayout.ghostTop}px, 0)`;

        highlightPlacementGhost(getDropOriginFromGhost());
    }

    function getDropOriginFromGhost() {
        if (!dragLayout || dragLayout.columnPitch <= 0 || dragLayout.rowPitch <= 0) {
            return null;
        }

        return {
            col: Math.round(
                (dragLayout.ghostLeft - dragLayout.boardLeft) / dragLayout.columnPitch
            ),
            row: Math.round(
                (dragLayout.ghostTop - dragLayout.boardTop) / dragLayout.rowPitch
            )
        };
    }

    function queueGhostPosition(clientX, clientY) {
        pendingDragPoint = { x: clientX, y: clientY };

        if (dragFrameId) return;

        dragFrameId = requestAnimationFrame(() => {
            dragFrameId = 0;

            if (!isDragging || !pendingDragPoint) return;

            const point = pendingDragPoint;
            pendingDragPoint = null;
            updateGhostPosition(point.x, point.y);
        });
    }

    function endDrag(clientX, clientY) {
        if (!isDragging) return;

        if (dragFrameId) {
            cancelAnimationFrame(dragFrameId);
            dragFrameId = 0;
        }
        pendingDragPoint = null;

        // Cập nhật theo đúng vị trí nhả cuối cùng, tránh dùng frame cũ.
        updateGhostPosition(clientX, clientY);
        const dropOrigin = getDropOriginFromGhost();

        isDragging = false;
        const slotIdx = activeDragSlotIndex;
        activeDragSlotIndex = null;

        if (draggedGhostEl?.parentNode) {
            draggedGhostEl.parentNode.removeChild(draggedGhostEl);
        }
        draggedGhostEl = null;

        clearPlacementGhost();

        if (dropOrigin && slotIdx !== null) {
            const piece = window.tmkGame.trayPieces[slotIdx];

            if (piece && !piece.used) {
                const result = window.tmkGame.placePiece(
                    piece,
                    dropOrigin.row,
                    dropOrigin.col
                );

                if (result.success) {
                    window.tmkEffects.playPlace();
                    selectedSlotIndex = null;
                    return;
                }
            }
        }

        renderTray(window.tmkGame.trayPieces);
    }


    function highlightPlacementGhost(targetCell) {
        if (
            targetCell &&
            currentHoverCell &&
            targetCell.row === currentHoverCell.row &&
            targetCell.col === currentHoverCell.col
        ) {
            return;
        }

        clearPlacementGhost();

        if (!targetCell || activeDragSlotIndex === null) return;

        const piece = window.tmkGame.trayPieces[activeDragSlotIndex];
        if (!piece || piece.used) return;

        currentHoverCell = { row: targetCell.row, col: targetCell.col };

        if (!window.tmkGame.canPlacePiece(piece, targetCell.row, targetCell.col)) {
            return;
        }

        piece.coords.forEach(([dx, dy]) => {
            const row = targetCell.row + dy;
            const col = targetCell.col + dx;
            const cell = cellElements[row]?.[col];

            if (cell) {
                cell.classList.add('ghost-valid');
                highlightedCells.push(cell);
            }
        });
    }

    function clearPlacementGhost() {
        highlightedCells.forEach(cell => {
            cell.classList.remove('ghost-valid');
        });

        highlightedCells = [];
        currentHoverCell = null;
    }

    // ==========================================
    // 7. THAO TÁC CHẠM CHỌN - CHẠM ĐẶT (TAP TO PLACE)
    // ==========================================
    function handleSlotClick(slotIdx) {
        const piece = window.tmkGame.trayPieces[slotIdx];
        if (!piece || piece.used) return;

        window.tmkEffects.playTap();

        if (selectedSlotIndex === slotIdx) {
            // Nhấp lại vào khối đang chọn thì hủy chọn
            selectedSlotIndex = null;
        } else {
            selectedSlotIndex = slotIdx;
        }
        renderTray(window.tmkGame.trayPieces);
    }

    function handleCellClick(row, col) {
        if (selectedSlotIndex === null) return;

        const piece = window.tmkGame.trayPieces[selectedSlotIndex];
        if (!piece || piece.used) return;

        // Thử đặt khối
        const result = window.tmkGame.placePiece(piece, row, col);
        if (result.success) {
            window.tmkEffects.playPlace();
            selectedSlotIndex = null;
            renderTray(window.tmkGame.trayPieces);
        } else {
            // Phản hồi rung nhẹ khi đặt không hợp lệ
            window.tmkEffects.playTap();
            const cellEl = cellElements[row][col];
            cellEl.style.backgroundColor = 'rgba(229, 62, 62, 0.4)';
            setTimeout(() => {
                cellEl.style.backgroundColor = '';
            }, 200);
        }
    }

    // Đăng ký sự kiện chuột và cảm ứng cho 3 khay khối
    traySlots.forEach((slotEl, idx) => {
        slotEl.addEventListener('pointerdown', (e) => {
            if (isDragging) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            const piece = window.tmkGame.trayPieces[idx];
            if (!piece || piece.used) return;

            e.preventDefault();
            activePointerId = e.pointerId;
            slotEl.setPointerCapture(e.pointerId);

            startDrag(idx, e.clientX, e.clientY, e.pointerType);
        });
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging || e.pointerId !== activePointerId) return;

        e.preventDefault();
        queueGhostPosition(e.clientX, e.clientY);
    }, { passive: false });

    window.addEventListener('pointerup', (e) => {
        if (!isDragging || e.pointerId !== activePointerId) return;

        activePointerId = null;
        endDrag(e.clientX, e.clientY);
    });

    window.addEventListener('pointercancel', (e) => {
        if (!isDragging || e.pointerId !== activePointerId) return;

        activePointerId = null;

        if (dragFrameId) {
            cancelAnimationFrame(dragFrameId);
            dragFrameId = 0;
        }

        pendingDragPoint = null;
        isDragging = false;
        activeDragSlotIndex = null;
        dragLayout = null;

        if (draggedGhostEl?.parentNode) {
            draggedGhostEl.parentNode.removeChild(draggedGhostEl);
        }

        draggedGhostEl = null;
        document.body.classList.remove('is-dragging');
        clearPlacementGhost();
        renderTray(window.tmkGame.trayPieces);
    });

    // ==========================================
    // 8. ĐĂNG KÝ HOOKS TỪ ENGINE GAME
    // ==========================================
    window.tmkGame.onBoardUpdate = (board) => {
        renderBoard(board);
    };

    window.tmkGame.onScoreUpdate = (score, combo, earned) => {
        renderScores(score, combo, earned);
    };

    window.tmkGame.onTrayUpdate = (trayPieces) => {
        renderTray(trayPieces);
    };

    window.tmkGame.onLinesCleared = ({ linesCount, rows, cols, clearedCells, combo, scoreEarned }) => {
        // 1. Âm thanh xóa hàng & combo
        window.tmkEffects.playLineClear(linesCount, combo);

        // 2. Rung màn hình bàn cờ
        window.tmkEffects.shakeBoard(gameBoardEl, linesCount);

        // 3. Animation phát sáng và nổ hạt gỗ trên từng ô bị xóa
        const sparkPositions = [];
        clearedCells.forEach(({ r, c, cellData }) => {
            const cellEl = cellElements[r][c];
            cellEl.classList.add('cell-clearing');

            const rect = cellEl.getBoundingClientRect();
            sparkPositions.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                color: cellData?.theme?.border || '#e4a853'
            });
        });

        window.tmkEffects.spawnWoodSparks(sparkPositions);

        // 4. Hiển thị điểm bay + thông báo Combo
        const boardRect = gameBoardEl.getBoundingClientRect();
        const centerX = boardRect.left + boardRect.width / 2;
        const centerY = boardRect.top + boardRect.height / 2;

        const text = combo > 1 ? `+${scoreEarned} 🔥 COMBO x${combo}!` : `+${scoreEarned}`;
        window.tmkEffects.showFloatingScore(centerX, centerY, text, combo > 1 ? 'combo' : 'normal');

        // Animation phát sáng trên các ô được giải phóng
        clearedCells.forEach(({ r, c }) => {
            const cellEl = cellElements[r]?.[c];
            if (!cellEl) return;

            cellEl.classList.remove('cell-clearing');
            cellEl.classList.add('cell-clearing');
        });

        setTimeout(() => {
            clearedCells.forEach(({ r, c }) => {
                cellElements[r]?.[c]?.classList.remove('cell-clearing');
            });
        }, 400);
    };

    // Khi đạt mốc 100.000 điểm
    window.tmkGame.onMilestone100k = (score) => {
        window.tmkEffects.playMilestone100k();
        window.tmkEffects.triggerConfetti();
        modalMilestone100k.classList.remove('hidden');
    };

    // Khi kích hoạt cơ chế cứu trợ
    window.tmkGame.onRescueTriggered = ({ clearedCells, message }) => {
        window.tmkEffects.playRescue();
        rescueDesc.innerText = message;
        rescueToast.classList.remove('hidden');

        clearedCells.forEach(({ r, c }) => {
            const cellEl = cellElements[r]?.[c];
            if (!cellEl) return;

            cellEl.classList.remove('cell-clearing');
            cellEl.classList.add('cell-clearing');
        });

        // CSS animation kết thúc sau 380 ms.
        // Gỡ class để ô trống hiện lại bình thường.
        setTimeout(() => {
            clearedCells.forEach(({ r, c }) => {
                cellElements[r]?.[c]?.classList.remove('cell-clearing');
            });
        }, 400);

        if (rescueToastTimer) clearTimeout(rescueToastTimer);
        rescueToastTimer = setTimeout(() => {
            rescueToast.classList.add('hidden');
        }, 3600);
    };
    // Khi kết thúc ván chơi (Game Over)
    window.tmkGame.onGameOver = ({ finalScore, bestScore, isNewRecord }) => {
        window.tmkEffects.playGameOver();
        finalScoreEl.innerText = finalScore.toLocaleString('vi-VN');
        finalBestEl.innerText = bestScore.toLocaleString('vi-VN');

        if (isNewRecord) {
            newRecordAlert.classList.remove('hidden');
            gameoverIcon.innerText = '👑';
            window.tmkEffects.playHighScore();
            window.tmkEffects.triggerConfetti();
        } else {
            newRecordAlert.classList.add('hidden');
            gameoverIcon.innerText = '🪵';
        }

        modalGameover.classList.remove('hidden');
    };

    // ==========================================
    // 9. ĐIỀU KHIỂN CHUYỂN MÀN HÌNH & NÚT BẤM
    // ==========================================
    function showScreen(screen) {
        [splashScreen, gameScreen].forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    // Bắt đầu chơi từ màn hình chào
    btnStartGame.addEventListener('click', () => {
        window.tmkEffects.ensureAudioContext();
        window.tmkEffects.playTap();
        window.tmkGame.newGame();
        showScreen(gameScreen);
    });

    btnSplashResume.addEventListener('click', () => {
        window.tmkEffects.ensureAudioContext();
        window.tmkEffects.playTap();
        const saved = window.tmkStorage.getSavedGameState();
        if (saved) {
            window.tmkGame.restoreSavedGame(saved);
        } else {
            window.tmkGame.newGame();
        }
        showScreen(gameScreen);
    });

    // Quay lại màn hình chính khi nhấp vào logo mini
    btnHomeQuick.addEventListener('click', () => {
        window.tmkEffects.playTap();
        window.tmkGame.saveState();
        updateSplashButtons();
        showScreen(splashScreen);
    });

    // Nút Chơi Lại (Yêu cầu xác nhận)
    btnRestartGame.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalConfirmRestart.classList.remove('hidden');
    });

    btnConfirmRestartYes.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalConfirmRestart.classList.add('hidden');
        window.tmkGame.newGame();
    });

    btnConfirmRestartNo.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalConfirmRestart.classList.add('hidden');
    });

    // Nút Bật/Tắt âm thanh
    function updateSoundIcons(enabled) {
        if (enabled) {
            iconSoundOn.classList.remove('hidden');
            iconSoundOff.classList.add('hidden');
        } else {
            iconSoundOn.classList.add('hidden');
            iconSoundOff.classList.remove('hidden');
        }
        settingSoundToggle.checked = enabled;
        window.tmkEffects.setSoundEnabled(enabled);
        window.tmkStorage.saveSettings({ soundEnabled: enabled });
    }

    btnToggleSound.addEventListener('click', () => {
        window.tmkEffects.ensureAudioContext();
        const current = window.tmkEffects.soundEnabled;
        updateSoundIcons(!current);
        if (!current) window.tmkEffects.playTap();
    });

    settingSoundToggle.addEventListener('change', (e) => {
        window.tmkEffects.ensureAudioContext();
        updateSoundIcons(e.target.checked);
        if (e.target.checked) window.tmkEffects.playTap();
    });

    // Modal Cài đặt
    btnOpenSettings.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalSettings.classList.remove('hidden');
    });

    btnCloseSettings.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalSettings.classList.add('hidden');
    });

    btnSettingsCloseOk.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalSettings.classList.add('hidden');
    });

    // Modal Milestone 100k
    btnCloseMilestone.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalMilestone100k.classList.add('hidden');
    });

    // Modal Game Over
    btnGameoverReplay.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalGameover.classList.add('hidden');
        window.tmkGame.newGame();
    });

    btnGameoverHome.addEventListener('click', () => {
        window.tmkEffects.playTap();
        modalGameover.classList.add('hidden');
        updateSplashButtons();
        showScreen(splashScreen);
    });

    // Cập nhật trạng thái nút Tiếp tục trên màn hình chào
    function updateSplashButtons() {
        const saved = window.tmkStorage.getSavedGameState();
        if (saved && saved.score > 0) {
            btnSplashResume.classList.remove('hidden');
            btnStartGame.querySelector('.btn-text').innerText = 'CHƠI VÁN MỚI';
        } else {
            btnSplashResume.classList.add('hidden');
            btnStartGame.querySelector('.btn-text').innerText = 'BẮT ĐẦU CHƠI';
        }
        const best = window.tmkStorage.getBestScore();
        splashBestScore.innerText = best.toLocaleString('vi-VN');
    }

    // ==========================================
    // 10. KHỞI CHẠY LẦN ĐẦU
    // ==========================================
    const settings = window.tmkStorage.getSettings();
    updateSoundIcons(settings.soundEnabled);

    initBoardDOM();
    updateSplashButtons();

    // Hỗ trợ phím tắt ESC để đóng modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modalConfirmRestart.classList.add('hidden');
            modalSettings.classList.add('hidden');
            modalMilestone100k.classList.add('hidden');
        }
    });

    console.log('%cTMK BLOCK%c — Game xếp khối gỗ đã sẵn sàng!', 'font-size: 16px; font-weight: bold; color: #f5b041;', 'color: #90a7c4;');
});

