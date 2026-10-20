# TMK BLOCK

TMK BLOCK là game xếp khối gỗ chạy trực tiếp trên trình duyệt. Người chơi đặt các khối lên bàn 8×8, hoàn thành hàng ngang hoặc cột dọc để xóa ô và ghi điểm.

## Chạy game

Đây là ứng dụng web tĩnh, không cần cài package hay build:

1. Mở `index.html` trực tiếp bằng trình duyệt; hoặc
2. Mở thư mục dự án bằng VS Code và chạy bằng một extension web server nếu trình duyệt của bạn hạn chế mở file cục bộ.

Các file JavaScript được nạp theo thứ tự trong `index.html`: thư viện khối, lưu trữ, hiệu ứng, game engine và giao diện.

## Cách chơi

- Bàn chơi có 8 hàng × 8 cột.
- Mỗi lượt, khay cung cấp tối đa 3 khối. Đặt các khối còn dùng được theo thứ tự bất kỳ; khi dùng hết cả 3 khối, game sinh bộ mới.
- Đặt khối sao cho toàn bộ ô của khối nằm trong bàn và không chồng lên ô đã có khối.
- Khi một hàng ngang hoặc cột dọc kín, các ô trên hàng/cột đó được xóa. Nếu nhiều hàng/cột kín cùng lúc, chúng được xóa trong cùng lượt.
- Khối hiện được đặt theo hướng có sẵn; game không có thao tác xoay khối.
- Khi không còn khối nào trong khay có thể đặt, game thử cơ chế cứu trợ: giải phóng hàng có nhiều ô bị chiếm nhất; nếu vẫn chưa có nước đi, cơ chế có thể giải phóng thêm cột giữa. Nếu sau đó vẫn không thể đi tiếp, ván kết thúc.

## Điều khiển

- **Máy tính:** kéo khối từ khay lên bàn; hoặc nhấp chọn khối rồi nhấp ô bắt đầu đặt trên bàn.
- **Điện thoại/màn hình cảm ứng:** chạm vào khối rồi chạm ô bắt đầu đặt; game cũng hỗ trợ thao tác kéo thả.
- Ô được nhấp/chạm là gốc trên cùng bên trái của hình khối. Hãy kiểm tra toàn bộ hình khối nằm trong bàn và không đè lên khối khác.
- Nút logo TMK BLOCK trên màn hình chơi đưa bạn về màn hình chính và lưu trạng thái ván hiện tại.

## Điểm và thử thách

- Điểm đặt khối bằng số ô của khối.
- Điểm xóa đường được tính theo tổng số hàng và cột bị xóa trong lượt:

  | Số hàng/cột xóa | Điểm cơ bản |
  | --- | ---: |
  | 1 | 100 |
  | 2 | 300 |
  | 3 | 600 |
  | 4 | 1.000 |
  | Từ 5 trở lên | 1.000 + 500 cho mỗi đường vượt quá 4 |

- Xóa đường ở các lượt liên tiếp tạo combo. Từ combo thứ 2, mỗi bậc combo cộng thêm 60 điểm.
- Đạt 100.000 điểm sẽ kích hoạt mốc thử thách 100K+. Tỉ lệ xuất hiện các khối thay đổi theo điểm số.
- Kỷ lục cá nhân được lưu riêng với trạng thái ván.

## Lưu dữ liệu

Game dùng `localStorage` của trình duyệt để lưu kỷ lục, cài đặt và ván đang chơi. Dữ liệu được lưu trên trình duyệt/thiết bị hiện tại; xóa dữ liệu trang web hoặc đổi trình duyệt có thể làm mất dữ liệu.

Nếu `localStorage` không dùng được, ứng dụng chuyển sang lưu tạm trong bộ nhớ của trang. Dữ liệu tạm này không được đảm bảo còn sau khi tải lại hoặc đóng trang.

## Cấu trúc dự án

- `index.html` — cấu trúc giao diện và thứ tự nạp script.
- `css/style.css` — giao diện, bố cục responsive và animation.
- `js/pieces.js` — thư viện hình khối, màu và cấp độ xuất hiện.
- `js/game.js` — luật đặt khối, xóa hàng/cột, tính điểm, sinh khối và cứu trợ.
- `js/main.js` — kết nối giao diện, thao tác chuột/cảm ứng và sự kiện game.
- `js/storage.js` — lưu/đọc điểm, cài đặt và ván chơi.
- `js/effects.js` — hiệu ứng âm thanh và hình ảnh.
- `test_game.js` — script kiểm tra một số logic hình khối và luật chơi.
- `assets/` — tài nguyên hình ảnh và âm thanh của dự án.

## Chạy kiểm tra logic hiện có

Cần cài Node.js. Từ thư mục dự án, chạy:

```sh
node test_game.js
```

Script này kiểm tra một số trường hợp cơ bản. Kết quả của nó không thay thế cho việc kiểm thử thao tác thực tế trong trình duyệt.