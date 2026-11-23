// The APIs and saved attempts provide English error messages. Translate them
// here so shared API consumers and previously saved records remain compatible.
const translations = new Map([
    ['Invalid homework link.', 'Liên kết bài tập không hợp lệ.'],
    ['This homework is no longer valid.', 'Bài tập này đã hết hạn hoặc không còn khả dụng.'],
    ['This examination no longer exists.', 'Bài kiểm tra này không còn tồn tại.'],
    ['Could not load this homework. Please try again.', 'Không thể tải bài tập. Em hãy thử lại.'],
    ['Invalid new attempt.', 'Không thể tạo lượt làm bài này.'],
    ['Please select an assigned student.', 'Em hãy chọn tên mình trong danh sách được giao bài.'],
    ['Student identity does not match the selected name.', 'Thông tin học sinh không khớp với tên đã chọn.'],
    ['This attempt belongs to another session.', 'Bài làm này thuộc một phiên khác.'],
    ['Student authentication is required.', 'Cần xác thực học sinh. Em hãy mở lại bài tập.'],
    ['Invalid student authentication.', 'Không thể xác thực học sinh. Em hãy mở lại bài tập.'],
    ['Student authentication expired. Please retry.', 'Phiên xác thực đã hết hạn. Em hãy thử lại.'],
    ['Invalid completed attempt.', 'Bài làm đã hoàn thành không hợp lệ.'],
    ['Attempt ownership could not be verified.', 'Không thể xác minh người làm bài này.'],
    ['The result does not match this homework.', 'Kết quả không khớp với bài tập này.'],
    ['This attempt ID is already in use.', 'Mã lượt làm bài này đã được sử dụng.'],
    ['A different final result has already been saved for this attempt.', 'Một kết quả khác đã được lưu cho lượt làm bài này.'],
    ['This result belongs to another browser identity. Restore the original browser session to submit it.', 'Kết quả này thuộc một phiên trình duyệt khác. Em hãy mở lại phiên ban đầu để gửi kết quả.'],
    ['Another save is in progress. Please retry.', 'Đang có một lượt lưu khác. Em hãy thử lại.'],
    ['The save service is temporarily unavailable. Please retry.', 'Dịch vụ lưu kết quả đang tạm gián đoạn. Em hãy thử lại.'],
    ['This browser cannot safely recover attempts across tabs. Please use a current browser.', 'Trình duyệt này không hỗ trợ khôi phục bài làm giữa các thẻ. Em hãy dùng trình duyệt đã được cập nhật.'],
    ['This attempt is already open in another tab. Close that tab first.', 'Bài làm này đang mở ở một thẻ khác. Em hãy đóng thẻ đó trước.'],
    ['Location requires a secure connection. Please open this test using HTTPS.', 'Tính năng định vị cần kết nối an toàn. Em hãy mở bài kiểm tra bằng liên kết HTTPS.'],
    ['This browser does not support location sharing. Please use a browser with location support.', 'Trình duyệt này không hỗ trợ chia sẻ vị trí. Em hãy dùng trình duyệt có hỗ trợ định vị.'],
    ['Location access is blocked. Allow location for this site in your browser settings, then retry.', 'Em hãy cho phép trang này truy cập vị trí trong cài đặt trình duyệt, rồi thử lại.'],
    ['Location request timed out. Check that device location is enabled, then retry.', 'Đã hết thời gian chờ xác định vị trí. Em hãy kiểm tra xem thiết bị đã bật định vị chưa rồi thử lại.'],
    ['Your location is unavailable. Enable device location services and check your connection, then retry.', 'Chưa xác định được vị trí. Em hãy bật định vị, kiểm tra kết nối mạng rồi thử lại.'],
]);

export function studentErrorMessage(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    if (message.startsWith('Progress sync ')) {
        return 'Không thể đồng bộ tiến độ. Em hãy nhờ giáo viên kiểm tra cài đặt xác thực và quy tắc cơ sở dữ liệu Firebase.';
    }
    if (message.startsWith('Firebase') || message.startsWith('Student authentication is unavailable.')) {
        return 'Không thể kết nối với dịch vụ xác thực hoặc cơ sở dữ liệu. Em hãy nhờ giáo viên kiểm tra cấu hình Firebase.';
    }
    return translations.get(message) ?? fallback;
}
