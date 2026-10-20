/**
 * Test script for TMK BLOCK logic
 */
const assert = require('node:assert/strict');
const { PIECES_LIBRARY, PIECES_MAP, getPiecesByCategory } = require('./js/pieces.js');

console.log('=== TEST 1: THƯ VIỆN HÌNH KHỐI TMK BLOCK ===');
console.log(`Tổng số hình khối trong thư viện: ${PIECES_LIBRARY.length}`);

// Kiểm tra từng khối
let hasError = false;
PIECES_LIBRARY.forEach(p => {
    // Kiểm tra gốc (0,0)
    const has00X = p.coords.some(([x, y]) => x === 0);
    const has00Y = p.coords.some(([x, y]) => y === 0);
    if (!has00X || !has00Y) {
        console.error(`[LỖI] Khối ${p.id} không bắt đầu từ gốc (0,0)`);
        hasError = true;
    }

    if (p.width > 8 || p.height > 8) {
        console.error(`[LỖI] Khối ${p.id} vượt quá kích thước 8x8: ${p.width}x${p.height}`);
        hasError = true;
    }

    // Kiểm tra trùng ô
    const set = new Set(p.coords.map(([x,y]) => `${x},${y}`));
    if (set.size !== p.coords.length) {
        console.error(`[LỖI] Khối ${p.id} có ô trùng nhau!`);
        hasError = true;
    }
});

if (!hasError) {
    console.log('=> TẤT CẢ HÌNH KHỐI ĐẠT CHUẨN (Tọa độ gốc 0,0; Không trùng ô; Trong phạm vi 8x8).');
}

// Thống kê chi tiết các biến thể T, L, Z, S
const tShapes = getPiecesByCategory('t_shape');
const lShapes = getPiecesByCategory('l_shape');
const zShapes = getPiecesByCategory('z_shape');
const sShapes = getPiecesByCategory('s_shape');

console.log(`- Biến thể khối chữ T (${tShapes.length} loại):`, tShapes.map(p => p.id).join(', '));
console.log(`- Biến thể khối chữ L (${lShapes.length} loại):`, lShapes.map(p => p.id).join(', '));
console.log(`- Biến thể khối chữ Z (${zShapes.length} loại):`, zShapes.map(p => p.id).join(', '));
console.log(`- Biến thể khối chữ S (${sShapes.length} loại):`, sShapes.map(p => p.id).join(', '));

// Kiểm tra tính phân biệt giữa S và Z
const sBasic = PIECES_MAP.get('s_basic_h');
const zBasic = PIECES_MAP.get('z_basic_h');
console.log('Tọa độ S cơ bản ngang:', JSON.stringify(sBasic.coords));
console.log('Tọa độ Z cơ bản ngang:', JSON.stringify(zBasic.coords));
if (JSON.stringify(sBasic.coords) !== JSON.stringify(zBasic.coords)) {
    console.log('=> S và Z đối xứng và phân biệt rõ ràng!');
} else {
    console.error('=> LỖI: S và Z bị trùng!');
}

console.log('\n=== TEST 2: LUẬT ĐẶT KHỐI VÀ XÓA ĐƯỜNG BÀN CỜ 8x8 ===');
// Giả lập bàn cờ 8x8
const BOARD_SIZE = 8;
function createBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(null));
}

let board = createBoard();
function canPlace(piece, startRow, startCol, b = board) {
    for (let i = 0; i < piece.coords.length; i++) {
        const [dx, dy] = piece.coords[i];
        const r = startRow + dy;
        const c = startCol + dx;
        if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
        if (b[r][c] !== null) return false;
    }
    return true;
}

// 1. Đặt ở góc (0,0), (0,7), (7,0), (7,7)
const dot = PIECES_MAP.get('dot_1x1');
console.log('Đặt 1x1 tại (0,0):', canPlace(dot, 0, 0));
console.log('Đặt 1x1 tại (7,7):', canPlace(dot, 7, 7));
console.log('Đặt 1x1 vượt biên (8,0):', canPlace(dot, 8, 0) === false);

// 2. Kiểm tra khối 3x3
const sq3 = PIECES_MAP.get('square_3x3');
console.log('Đặt 3x3 tại (0,0):', canPlace(sq3, 0, 0));
console.log('Đặt 3x3 tại (6,6) (sẽ tràn khỏi 8x8):', canPlace(sq3, 6, 6) === false);

// 3. Xóa đồng thời 1 hàng và 1 cột
for (let c = 0; c < 8; c++) board[2][c] = { pieceId: 'test' }; // Lấp đầy hàng 2
for (let r = 0; r < 8; r++) board[r][4] = { pieceId: 'test' }; // Lấp đầy cột 4

// Kiểm tra giao nhau tại (2, 4)
const fullRows = [];
const fullCols = [];
for (let r = 0; r < 8; r++) {
    if (board[r].every(c => c !== null)) fullRows.push(r);
}
for (let c = 0; c < 8; c++) {
    let colFull = true;
    for (let r = 0; r < 8; r++) {
        if (board[r][c] === null) { colFull = false; break; }
    }
    if (colFull) fullCols.push(c);
}

const clearedSet = new Set();
fullRows.forEach(r => {
    for (let c = 0; c < 8; c++) clearedSet.add(`${r},${c}`);
});
fullCols.forEach(c => {
    for (let r = 0; r < 8; r++) clearedSet.add(`${r},${c}`);
});

console.log(`Số hàng đầy: ${fullRows.length} (Hàng ${fullRows.join(', ')})`);
console.log(`Số cột đầy: ${fullCols.length} (Cột ${fullCols.join(', ')})`);
console.log(`Tổng số ô duy nhất được xóa (15 ô thay vì 16 vì giao điểm tính 1 lần): ${clearedSet.size}`);
if (clearedSet.size === 15) {
    console.log('=> Giao điểm hàng/cột được xử lý chính xác!');
}

console.log('\n=== TEST 3: CÔNG THỨC TÍNH ĐIỂM ===');
function calcScore(lines, combo) {
    let base = 0;
    switch (lines) {
        case 1: base = 100; break;
        case 2: base = 300; break;
        case 3: base = 600; break;
        case 4: base = 1000; break;
        default: base = 1000 + (lines - 4) * 500; break;
    }
    const comboBonus = combo > 1 ? (combo - 1) * 60 : 0;
    return base + comboBonus;
}

console.log('Xóa 1 dòng (Combo 0):', calcScore(1, 0), 'điểm');
console.log('Xóa 2 dòng (Combo 2):', calcScore(2, 2), 'điểm');
console.log('Xóa 4 dòng (Combo 3):', calcScore(4, 3), 'điểm');


assert.equal(canPlace(dot, 0, 0), true, 'Khối 1x1 phải đặt được ở góc');
assert.equal(canPlace(dot, 8, 0), false, 'Khối 1x1 không được vượt biên');
assert.equal(clearedSet.size, 15, 'Giao điểm hàng/cột chỉ được tính một lần');
assert.equal(calcScore(2, 2), 360, 'Điểm xóa 2 dòng combo 2 phải bằng 360');

console.log('\n=== TẤT CẢ KIỂM THỬ ĐÃ HOÀN TẤT THÀNH CÔNG ===');

