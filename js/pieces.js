/**
 * TMK BLOCK — GAME XẾP KHỐI GỖ
 * js/pieces.js: Thư viện hình khối chi tiết với đầy đủ biến thể T, L, Z, S, thanh, vuông.
 * Tọa độ chuẩn hóa (x, y) bắt đầu từ (0, 0).
 */

const PIECE_CATEGORIES = {
    DOT: 'dot',
    LINE: 'line',
    SQUARE: 'square',
    RECT: 'rect',
    CORNER: 'corner',
    T_SHAPE: 't_shape',
    L_SHAPE: 'l_shape',
    Z_SHAPE: 'z_shape',
    S_SHAPE: 's_shape'
};

// Bảng màu gỗ sang trọng theo từng loại khối
const WOOD_THEMES = {
    GOLDEN_OAK: { id: 'oak', name: 'Gỗ Sồi Vàng', bg: 'linear-gradient(135deg, #e4a853, #c27d28)', border: '#fae092', shadow: '#78460e' },
    WALNUT: { id: 'walnut', name: 'Gỗ Óc Chó', bg: 'linear-gradient(135deg, #a66a38, #6e3f16)', border: '#c98a53', shadow: '#3f1f06' },
    MAHOGANY: { id: 'mahogany', name: 'Gỗ Gụ Đỏ', bg: 'linear-gradient(135deg, #b84b39, #822214)', border: '#e6735e', shadow: '#4d0f06' },
    TEAK_AMBER: { id: 'teak', name: 'Gỗ Tếch Hổ Phách', bg: 'linear-gradient(135deg, #d9822b, #9e5008)', border: '#f7ab56', shadow: '#572702' },
    CEDAR: { id: 'cedar', name: 'Gỗ Tuyết Tùng', bg: 'linear-gradient(135deg, #4d8f78, #2a5a4a)', border: '#7ec4ad', shadow: '#133328' },
    MAPLE: { id: 'maple', name: 'Gỗ Phong Vàng', bg: 'linear-gradient(135deg, #dca842, #ad7818)', border: '#f5c96e', shadow: '#613e05' },
    ROSEWOOD: { id: 'rosewood', name: 'Gỗ Cẩm Lai', bg: 'linear-gradient(135deg, #8f4b75, #5a2044)', border: '#bc75a1', shadow: '#330c24' },
    EBONY: { id: 'ebony', name: 'Gỗ Mun Xanh', bg: 'linear-gradient(135deg, #3d6380, #1c394d)', border: '#6ca2c7', shadow: '#0c1d29' },
};

/**
 * Chuẩn hóa danh sách tọa độ về gốc (0, 0), tính kích thước w x h và kiểm tra tính hợp lệ
 */
function normalizePiece(coords, id, name, category, theme, tier = 1) {
    if (!coords || coords.length === 0) {
        throw new Error(`Piece ${id} không có tọa độ hợp lệ`);
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Kiểm tra ô trùng lặp
    const seen = new Set();
    coords.forEach(([x, y]) => {
        const key = `${x},${y}`;
        if (seen.has(key)) {
            throw new Error(`Piece ${id} bị trùng tọa độ tại (${x}, ${y})`);
        }
        seen.add(key);

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    });

    const normalizedCoords = coords.map(([x, y]) => [x - minX, y - minY]);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    if (width > 8 || height > 8) {
        throw new Error(`Piece ${id} vượt kích thước bàn cờ 8x8: ${width}x${height}`);
    }

    // Sắp xếp tọa độ theo dòng y rồi cột x để so sánh đồng nhất
    normalizedCoords.sort((a, b) => a[1] !== b[1] ? a[1] - b[1] : a[0] - b[0]);

    return {
        id,
        name,
        category,
        coords: normalizedCoords,
        width,
        height,
        size: coords.length,
        theme,
        tier // 1: Dễ/Nhỏ, 2: Vừa, 3: Lớn/Thử thách
    };
}

/**
 * THƯ VIỆN HÌNH KHỐI ĐẦY ĐỦ CỦA TMK BLOCK
 */
const RAW_PIECES = [
    // === 1. ĐIỂM ĐƠN & THANH NGẮN (Tier 1) ===
    {
        id: 'dot_1x1',
        name: 'Khối Đơn 1x1',
        cat: PIECE_CATEGORIES.DOT,
        theme: WOOD_THEMES.GOLDEN_OAK,
        tier: 1,
        coords: [[0, 0]]
    },
    {
        id: 'line_2h',
        name: 'Thanh Ngang 1x2',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.GOLDEN_OAK,
        tier: 1,
        coords: [[0, 0], [1, 0]]
    },
    {
        id: 'line_2v',
        name: 'Thanh Dọc 2x1',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.GOLDEN_OAK,
        tier: 1,
        coords: [[0, 0], [0, 1]]
    },

    // === 2. THANH DÀI 3, 4, 5 Ô ===
    {
        id: 'line_3h',
        name: 'Thanh Ngang 1x3',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.MAPLE,
        tier: 1,
        coords: [[0, 0], [1, 0], [2, 0]]
    },
    {
        id: 'line_3v',
        name: 'Thanh Dọc 3x1',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.MAPLE,
        tier: 1,
        coords: [[0, 0], [0, 1], [0, 2]]
    },
    {
        id: 'line_4h',
        name: 'Thanh Ngang 1x4',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[0, 0], [1, 0], [2, 0], [3, 0]]
    },
    {
        id: 'line_4v',
        name: 'Thanh Dọc 4x1',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[0, 0], [0, 1], [0, 2], [0, 3]]
    },
    {
        id: 'line_5h',
        name: 'Thanh Ngang Dài 1x5',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.EBONY,
        tier: 3,
        coords: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]
    },
    {
        id: 'line_5v',
        name: 'Thanh Dọc Dài 5x1',
        cat: PIECE_CATEGORIES.LINE,
        theme: WOOD_THEMES.EBONY,
        tier: 3,
        coords: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]
    },

    // === 3. HÌNH VUÔNG VÀ HÌNH CHỮ NHẬT ===
    {
        id: 'square_2x2',
        name: 'Hình Vuông 2x2',
        cat: PIECE_CATEGORIES.SQUARE,
        theme: WOOD_THEMES.WALNUT,
        tier: 1,
        coords: [[0, 0], [1, 0], [0, 1], [1, 1]]
    },
    {
        id: 'square_3x3',
        name: 'Hình Vuông Lớn 3x3',
        cat: PIECE_CATEGORIES.SQUARE,
        theme: WOOD_THEMES.EBONY,
        tier: 3,
        coords: [
            [0, 0], [1, 0], [2, 0],
            [0, 1], [1, 1], [2, 1],
            [0, 2], [1, 2], [2, 2]
        ]
    },
    {
        id: 'rect_2x3',
        name: 'Hình Chữ Nhật Dọc 2x3',
        cat: PIECE_CATEGORIES.RECT,
        theme: WOOD_THEMES.ROSEWOOD,
        tier: 3,
        coords: [
            [0, 0], [1, 0],
            [0, 1], [1, 1],
            [0, 2], [1, 2]
        ]
    },
    {
        id: 'rect_3x2',
        name: 'Hình Chữ Nhật Ngang 3x2',
        cat: PIECE_CATEGORIES.RECT,
        theme: WOOD_THEMES.ROSEWOOD,
        tier: 3,
        coords: [
            [0, 0], [1, 0], [2, 0],
            [0, 1], [1, 1], [2, 1]
        ]
    },

    // === 4. HÌNH GÓC VUÔNG NHỎ 2x2 (3 ô) ===
    {
        id: 'corner_tl',
        name: 'Góc Nhỏ Trên Trái',
        cat: PIECE_CATEGORIES.CORNER,
        theme: WOOD_THEMES.CEDAR,
        tier: 1,
        coords: [[0, 0], [1, 0], [0, 1]]
    },
    {
        id: 'corner_tr',
        name: 'Góc Nhỏ Trên Phải',
        cat: PIECE_CATEGORIES.CORNER,
        theme: WOOD_THEMES.CEDAR,
        tier: 1,
        coords: [[0, 0], [1, 0], [1, 1]]
    },
    {
        id: 'corner_br',
        name: 'Góc Nhỏ Dưới Phải',
        cat: PIECE_CATEGORIES.CORNER,
        theme: WOOD_THEMES.CEDAR,
        tier: 1,
        coords: [[1, 0], [0, 1], [1, 1]]
    },
    {
        id: 'corner_bl',
        name: 'Góc Nhỏ Dưới Trái',
        cat: PIECE_CATEGORIES.CORNER,
        theme: WOOD_THEMES.CEDAR,
        tier: 1,
        coords: [[0, 0], [0, 1], [1, 1]]
    },

    // === 5. KHỐI CHỮ T VÀ CÁC BIẾN THỂ ĐẦY ĐỦ ===
    // T xuôi: thanh ngang 3 ô, thân dọc 1 ô ở giữa hướng xuống
    {
        id: 't_down',
        name: 'Khối T Xuôi',
        cat: PIECE_CATEGORIES.T_SHAPE,
        theme: WOOD_THEMES.MAHOGANY,
        tier: 2,
        coords: [[0, 0], [1, 0], [2, 0], [1, 1]]
    },
    // T ngược: thanh ngang 3 ô ở dưới, thân dọc hướng lên
    {
        id: 't_up',
        name: 'Khối T Ngược',
        cat: PIECE_CATEGORIES.T_SHAPE,
        theme: WOOD_THEMES.MAHOGANY,
        tier: 2,
        coords: [[1, 0], [0, 1], [1, 1], [2, 1]]
    },
    // T xoay trái: thanh dọc 3 ô, nhánh ngang hướng sang trái
    {
        id: 't_left',
        name: 'Khối T Xoay Trái',
        cat: PIECE_CATEGORIES.T_SHAPE,
        theme: WOOD_THEMES.MAHOGANY,
        tier: 2,
        coords: [[1, 0], [0, 1], [1, 1], [1, 2]]
    },
    // T xoay phải: thanh dọc 3 ô, nhánh ngang hướng sang phải
    {
        id: 't_right',
        name: 'Khối T Xoay Phải',
        cat: PIECE_CATEGORIES.T_SHAPE,
        theme: WOOD_THEMES.MAHOGANY,
        tier: 2,
        coords: [[0, 0], [0, 1], [1, 1], [0, 2]]
    },
    

    // === 6. KHỐI CHỮ L VÀ CÁC BIẾN THỂ ĐẦY ĐỦ ===
    // L cơ bản: dọc 3 ô, chân ngang 2 ô
    {
        id: 'l_stand_bl',
        name: 'Khối L Cơ Bản (Chân Dưới)',
        cat: PIECE_CATEGORIES.L_SHAPE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[0, 0], [0, 1], [0, 2], [1, 2]]
    },
    // L lật đối xứng (chân hướng sang trái)
    {
        id: 'l_stand_br',
        name: 'Khối L Ngược (Chân Trái Dưới)',
        cat: PIECE_CATEGORIES.L_SHAPE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[1, 0], [1, 1], [0, 2], [1, 2]]
    },
    // L xoay 90°: thanh ngang 3 ô, nhánh lên
    {
        id: 'l_rot_90',
        name: 'Khối L Nằm Ngang (Nhánh Phải)',
        cat: PIECE_CATEGORIES.L_SHAPE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[0, 0], [1, 0], [2, 0], [2, 1]]
    },
    // L xoay 180°: dọc 3 ô, nhánh trên
    {
        id: 'l_rot_180',
        name: 'Khối L Xoay 180° (Nhánh Trên)',
        cat: PIECE_CATEGORIES.L_SHAPE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[0, 0], [1, 0], [0, 1], [0, 2]]
    },
    // L xoay 270°: ngang 3 ô, nhánh dưới
    {
        id: 'l_rot_270',
        name: 'Khối L Nằm Ngang (Nhánh Trái)',
        cat: PIECE_CATEGORIES.L_SHAPE,
        theme: WOOD_THEMES.TEAK_AMBER,
        tier: 2,
        coords: [[0, 0], [0, 1], [1, 1], [2, 1]]
    },
   
    // L lớn 3x3: cạnh dài 3 ô và chân dài 3 ô
    {
        id: 'l_big_3x3',
        name: 'Khối L Lớn 3x3',
        cat: PIECE_CATEGORIES.L_SHAPE,
        theme: WOOD_THEMES.EBONY,
        tier: 3,
        coords: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]
    },

    // === 7. KHỐI CHỮ Z VÀ CÁC BIẾN THỂ ĐẦY ĐỦ ===
    // Z cơ bản nằm ngang: [(0,0), (1,0), (1,1), (2,1)]
    {
        id: 'z_basic_h',
        name: 'Khối Z Cơ Bản Ngang',
        cat: PIECE_CATEGORIES.Z_SHAPE,
        theme: WOOD_THEMES.ROSEWOOD,
        tier: 2,
        coords: [[0, 0], [1, 0], [1, 1], [2, 1]]
    },
    // Z nằm dọc: [(1,0), (0,1), (1,1), (0,2)]
    {
        id: 'z_basic_v',
        name: 'Khối Z Cơ Bản Dọc',
        cat: PIECE_CATEGORIES.Z_SHAPE,
        theme: WOOD_THEMES.ROSEWOOD,
        tier: 2,
        coords: [[1, 0], [0, 1], [1, 1], [0, 2]]
    },
    // Z xoay 90°: đối xứng qua trục
    {
        id: 'z_rot_90',
        name: 'Khối Z Xoay 90°',
        cat: PIECE_CATEGORIES.Z_SHAPE,
        theme: WOOD_THEMES.ROSEWOOD,
        tier: 2,
        coords: [[0, 0], [0, 1], [1, 1], [1, 2]]
    },

    // === 8. KHỐI CHỮ S VÀ CÁC BIẾN THỂ ĐẦY ĐỦ (Đối xứng Z) ===
    // S cơ bản nằm ngang: [(1,0), (2,0), (0,1), (1,1)]
    {
        id: 's_basic_h',
        name: 'Khối S Cơ Bản Ngang',
        cat: PIECE_CATEGORIES.S_SHAPE,
        theme: WOOD_THEMES.CEDAR,
        tier: 2,
        coords: [[1, 0], [2, 0], [0, 1], [1, 1]]
    },
    // S nằm dọc: [(0,0), (0,1), (1,1), (1,2)]
    {
        id: 's_basic_v',
        name: 'Khối S Cơ Bản Dọc',
        cat: PIECE_CATEGORIES.S_SHAPE,
        theme: WOOD_THEMES.CEDAR,
        tier: 2,
        coords: [[0, 0], [0, 1], [1, 1], [1, 2]]
    },
    // S xoay 90°
    {
        id: 's_rot_90',
        name: 'Khối S Xoay 90°',
        cat: PIECE_CATEGORIES.S_SHAPE,
        theme: WOOD_THEMES.CEDAR,
        tier: 2,
        coords: [[0, 1], [1, 0], [1, 1], [2, 0]]
    },
    
];

// Khởi tạo thư viện đã chuẩn hóa
const PIECES_LIBRARY = RAW_PIECES.map(p => 
    normalizePiece(p.coords, p.id, p.name, p.cat, p.theme, p.tier)
);

// Map tra cứu nhanh theo ID
const PIECES_MAP = new Map(PIECES_LIBRARY.map(p => [p.id, p]));

/**
 * Lấy các khối theo danh mục
 */
function getPiecesByCategory(cat) {
    return PIECES_LIBRARY.filter(p => p.category === cat);
}

/**
 * Lấy các khối theo bậc Tier (1, 2, 3)
 */
function getPiecesByTier(tier) {
    return PIECES_LIBRARY.filter(p => p.tier === tier);
}

/**
 * Lấy ngẫu nhiên một mẫu khối dựa trên trọng số độ khó
 * @param {number} currentScore Điểm số hiện tại của người chơi
 */
function getRandomPieceTemplate(currentScore = 0) {
    const isHardMode = currentScore >= 100000;
    const extraTiers = Math.min(5, Math.floor(Math.max(0, currentScore - 100000) / 50000));

    // Tính tỷ lệ xuất hiện theo độ khó
    // Điểm < 100k: Ưu tiên khối nhỏ và vừa (Tier 1: 50%, Tier 2: 38%, Tier 3: 12%)
    // Điểm >= 100k: Tăng khối khó/dài/lớn (Tier 1: 25%, Tier 2: 40%, Tier 3: 35% + extra)
    let weightTier1 = isHardMode ? Math.max(15, 25 - extraTiers * 2) : 50;
    let weightTier2 = isHardMode ? 40 : 38;
    let weightTier3 = isHardMode ? Math.min(50, 35 + extraTiers * 3) : 12;

    const rand = Math.random() * (weightTier1 + weightTier2 + weightTier3);

    let targetTier = 1;
    if (rand < weightTier1) {
        targetTier = 1;
    } else if (rand < weightTier1 + weightTier2) {
        targetTier = 2;
    } else {
        targetTier = 3;
    }

    const candidates = PIECES_LIBRARY.filter(p => p.tier === targetTier);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    return clonePiece(chosen);
}

/**
 * Sao chép sâu đối tượng piece kèm một instanceId duy nhất
 */
function clonePiece(piece) {
    return {
        ...piece,
        instanceId: 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
        coords: piece.coords.map(([x, y]) => [x, y]),
        used: false
    };
}

// Xuất ra phạm vi toàn cục hoặc module Node để kiểm thử
const TMK_PIECES_EXPORT = {
    PIECE_CATEGORIES,
    WOOD_THEMES,
    PIECES_LIBRARY,
    PIECES_MAP,
    normalizePiece,
    getPiecesByCategory,
    getPiecesByTier,
    getRandomPieceTemplate,
    clonePiece
};

if (typeof window !== 'undefined') {
    window.TMK_PIECES = TMK_PIECES_EXPORT;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TMK_PIECES_EXPORT;
}

