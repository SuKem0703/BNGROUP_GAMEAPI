import { ApplicationDbContext } from '../config/database';
import { ItemDef, ItemType, CurrencyType } from '../models/game/ItemDef';

export class ItemSeeder {
    public static async seedItems(): Promise<void> {
        try {
            const itemRepo = ApplicationDbContext.getRepository(ItemDef);

            // Kiểm tra xem database đã có dữ liệu chưa để tránh trùng lặp
            const count = await itemRepo.count();
            if (count > 0) {
                console.log("✅ Dữ liệu ItemDef đã tồn tại. Bỏ qua bước khởi tạo.");
                return;
            }

            console.log("⏳ Đang khởi tạo dữ liệu ItemDef gốc...");

            const items: Partial<ItemDef>[] = [
                // ==========================================
                // 101-199: Kiếm (Equipment - Stackable: false)
                // ==========================================
                { id: 101, name: "Kiếm Gỗ Tập Sự", description: "Vũ khí thô sơ cho người mới.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 50, sellPrice: 10, currency: CurrencyType.Coin },
                { id: 102, name: "Kiếm Đồng", description: "Thanh kiếm nặng nề nhưng chắc chắn.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 150, sellPrice: 30, currency: CurrencyType.Coin },
                { id: 103, name: "Kiếm Sắt Tiêu Chuẩn", description: "Trang bị cơ bản của lính gác.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 300, sellPrice: 60, currency: CurrencyType.Coin },
                { id: 104, name: "Kiếm Bạc Diệt Ma", description: "Lưỡi kiếm sáng loáng, kỵ tà ma.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 800, sellPrice: 160, currency: CurrencyType.Coin },
                { id: 105, name: "Kiếm Dũng Sĩ", description: "Vũ khí của những hiệp sĩ thực thụ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1500, sellPrice: 300, currency: CurrencyType.Coin },

                // ==========================================
                // 201-299: Khiên (Equipment - Stackable: false)
                // ==========================================
                { id: 201, name: "Khiên Gỗ Tròn", description: "Chiếc khiên mỏng manh.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 40, sellPrice: 8, currency: CurrencyType.Coin },
                { id: 202, name: "Khiên Đồng Chóp", description: "Chống chịu được các đòn chém nhẹ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 120, sellPrice: 24, currency: CurrencyType.Coin },
                { id: 203, name: "Khiên Thép Hình Tháp", description: "Che chắn toàn diện cho cơ thể.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 250, sellPrice: 50, currency: CurrencyType.Coin },
                { id: 204, name: "Khiên Vảy Rồng", description: "Khảm vảy rồng lửa, chống nhiệt tốt.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 700, sellPrice: 140, currency: CurrencyType.Coin },
                { id: 205, name: "Khiên Ánh Sáng", description: "Phát ra vầng hào quang bảo vệ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1400, sellPrice: 280, currency: CurrencyType.Coin },

                // ==========================================
                // 301-399: Mũ giáp (Equipment - Stackable: false)
                // ==========================================
                { id: 301, name: "Mũ Da Bò", description: "Bảo vệ đầu khỏi những vết xước.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 30, sellPrice: 6, currency: CurrencyType.Coin },
                { id: 302, name: "Mũ Sắt Hở Mặt", description: "Tầm nhìn tốt nhưng kém an toàn.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 100, sellPrice: 20, currency: CurrencyType.Coin },
                { id: 303, name: "Mũ Thép Kín", description: "Hơi ngột ngạt nhưng rất vững chãi.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 220, sellPrice: 44, currency: CurrencyType.Coin },
                { id: 304, name: "Mũ Sừng Trâu", description: "Dành cho chiến binh thích xung phong.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 500, sellPrice: 100, currency: CurrencyType.Coin },
                { id: 305, name: "Mũ Kỵ Sĩ Bạc", description: "Biểu tượng của lòng trung thành.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1000, sellPrice: 200, currency: CurrencyType.Coin },

                // ==========================================
                // 401-499: Áo giáp (Equipment - Stackable: false)
                // ==========================================
                { id: 401, name: "Áo Da Dày", description: "Trang bị cơ bản của thợ săn.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 60, sellPrice: 12, currency: CurrencyType.Coin },
                { id: 402, name: "Giáp Xích Thô", description: "Nặng nề và phát ra tiếng ồn.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 180, sellPrice: 36, currency: CurrencyType.Coin },
                { id: 403, name: "Giáp Ngực Thép", description: "Chống chịu tốt trước tên bắn.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 400, sellPrice: 80, currency: CurrencyType.Coin },
                { id: 404, name: "Giáp Vảy Mithril", description: "Siêu nhẹ và siêu bền.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1000, sellPrice: 200, currency: CurrencyType.Coin },
                { id: 405, name: "Chiến Giáp Hoàng Gia", description: "Chỉ dành cho chỉ huy cấp cao.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 2000, sellPrice: 400, currency: CurrencyType.Coin },

                // ==========================================
                // 501-599: Quyền trượng (Equipment - Stackable: false)
                // ==========================================
                { id: 501, name: "Trượng Gỗ Thông", description: "Chứa một chút ma lực tự nhiên.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 50, sellPrice: 10, currency: CurrencyType.Coin },
                { id: 502, name: "Trượng Tập Sự", description: "Có gắn tinh thể ma thuật nhỏ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 150, sellPrice: 30, currency: CurrencyType.Coin },
                { id: 503, name: "Trượng Hỏa Thạch", description: "Tăng cường sức mạnh phép lửa.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 350, sellPrice: 70, currency: CurrencyType.Coin },
                { id: 504, name: "Trượng Băng Giá", description: "Mát lạnh khi chạm vào.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 850, sellPrice: 170, currency: CurrencyType.Coin },
                { id: 505, name: "Quyền Trượng Hiền Triết", description: "Hội tụ tinh hoa đất trời.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1600, sellPrice: 320, currency: CurrencyType.Coin },

                // ==========================================
                // 601-699: Sách phép/Catalyst (Equipment - Stackable: false)
                // ==========================================
                { id: 601, name: "Sổ Tay Chép Phép", description: "Ghi chú lộn xộn của người mới học.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 45, sellPrice: 9, currency: CurrencyType.Coin },
                { id: 602, name: "Cẩm Nang Yếu Lĩnh", description: "Chứa các câu thần chú phòng ngự.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 130, sellPrice: 26, currency: CurrencyType.Coin },
                { id: 603, name: "Quả Cầu Thủy Tinh", description: "Tập trung tâm trí người sử dụng.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 320, sellPrice: 64, currency: CurrencyType.Coin },
                { id: 604, name: "Cuốn Sách Địa Ngục", description: "Toát ra khí tức đen tối.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 900, sellPrice: 180, currency: CurrencyType.Coin },
                { id: 605, name: "Thánh Thư Cổ Tích", description: "Phục hồi sinh lực cho đồng minh.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1550, sellPrice: 310, currency: CurrencyType.Coin },

                // ==========================================
                // 701-799: Mũ phép (Equipment - Stackable: false)
                // ==========================================
                { id: 701, name: "Mũ Vải Cũ", description: "Một chiếc mũ rộng vành bị rách.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 25, sellPrice: 5, currency: CurrencyType.Coin },
                { id: 702, name: "Nón Chóp Thuật Sĩ", description: "Giúp giữ ấm đầu khi niệm chú.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 90, sellPrice: 18, currency: CurrencyType.Coin },
                { id: 703, name: "Vương Miện Lá Cây", description: "Được phước lành của Tinh linh.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 200, sellPrice: 40, currency: CurrencyType.Coin },
                { id: 704, name: "Mũ Bóng Đêm", description: "Giấu kín khuôn mặt người đội.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 480, sellPrice: 96, currency: CurrencyType.Coin },
                { id: 705, name: "Nón Đại Pháp Sư", description: "Đỉnh cao của sự thông thái.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1100, sellPrice: 220, currency: CurrencyType.Coin },

                // ==========================================
                // 801-899: Áo choàng phép (Equipment - Stackable: false)
                // ==========================================
                { id: 801, name: "Áo Choàng Sờn", description: "Mỏng manh nhưng thoải mái.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 35, sellPrice: 7, currency: CurrencyType.Coin },
                { id: 802, name: "Pháp Phục Thực Tập", description: "Đồng phục của học viện ma thuật.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 110, sellPrice: 22, currency: CurrencyType.Coin },
                { id: 803, name: "Áo Choàng Gió", description: "Tăng tốc độ di chuyển nhẹ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 280, sellPrice: 56, currency: CurrencyType.Coin },
                { id: 804, name: "Pháp Phục Hư Không", description: "Hấp thụ các đòn tấn công phép.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 850, sellPrice: 170, currency: CurrencyType.Coin },
                { id: 805, name: "Áo Choàng Thiên Hà", description: "Bầu trời đêm thu nhỏ trên vạt áo.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1800, sellPrice: 360, currency: CurrencyType.Coin },

                // ==========================================
                // 901-999: Ring (Equipment - Stackable: false)
                // ==========================================
                { id: 901, name: "Nhẫn Đồng Xỉn Màu", description: "Không có giá trị thực chiến.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 20, sellPrice: 4, currency: CurrencyType.Coin },
                { id: 902, name: "Nhẫn Lục Bảo Nhỏ", description: "Tăng chút ít lượng máu tối đa.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 150, sellPrice: 30, currency: CurrencyType.Coin },
                { id: 903, name: "Nhẫn Hồng Ngọc", description: "Nóng bỏng, tăng sức mạnh đòn đánh.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 400, sellPrice: 80, currency: CurrencyType.Coin },
                { id: 904, name: "Nhẫn Lam Thạch", description: "Giúp phục hồi năng lượng nhanh hơn.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 400, sellPrice: 80, currency: CurrencyType.Coin },
                { id: 905, name: "Nhẫn Chân Lý", description: "Món trang sức hiếm có khó tìm.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 200, sellPrice: 40, currency: CurrencyType.Gem }, // Bán bằng GEM

                // ==========================================
                // 1001-1099: Amulet (Equipment - Stackable: false)
                // ==========================================
                { id: 1001, name: "Dây Chuyền Nanh Sói", description: "Chiến lợi phẩm từ rừng rậm.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 30, sellPrice: 6, currency: CurrencyType.Coin },
                { id: 1002, name: "Bùa Hộ Mệnh Gỗ", description: "Mang lại may mắn nho nhỏ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 100, sellPrice: 20, currency: CurrencyType.Coin },
                { id: 1003, name: "Dây Chuyền Bạc Tinh Xảo", description: "Kháng lại phép thuật hắc ám.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 500, sellPrice: 100, currency: CurrencyType.Coin },
                { id: 1004, name: "Trái Tim Rồng", description: "Tăng sinh lực mạnh mẽ.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1200, sellPrice: 240, currency: CurrencyType.Coin },
                { id: 1005, name: "Amulet Thời Gian", description: "Tuyệt tác của các vị thần.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 300, sellPrice: 60, currency: CurrencyType.Gem }, // Bán bằng GEM

                // ==========================================
                // 1101-1199: Earring (Equipment - Stackable: false)
                // ==========================================
                { id: 1101, name: "Khuyên Tai Sắt", description: "Đơn giản và thô kệch.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 25, sellPrice: 5, currency: CurrencyType.Coin },
                { id: 1102, name: "Khuyên Tai Lông Chim", description: "Rất nhẹ, tăng sự linh hoạt.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 120, sellPrice: 24, currency: CurrencyType.Coin },
                { id: 1103, name: "Bông Tai Pha Lê", description: "Tăng khả năng tập trung ma lực.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 450, sellPrice: 90, currency: CurrencyType.Coin },
                { id: 1104, name: "Khuyên Tai Huyết Nguyệt", description: "Hút máu kẻ thù khi tấn công.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 1500, sellPrice: 300, currency: CurrencyType.Coin },
                { id: 1105, name: "Giọt Lệ Nữ Thần", description: "Khuyên tai tỏa sáng lấp lánh.", itemType: ItemType.Equipment, isStackable: false, buyPrice: 250, sellPrice: 50, currency: CurrencyType.Gem }, // Bán bằng GEM

                // ==========================================
                // 1201-1299: Seed (Seed - Stackable: true)
                // ==========================================
                { id: 1201, name: "Hạt Lúa Mì", description: "Dễ trồng, thời gian thu hoạch nhanh.", itemType: ItemType.Seed, isStackable: true, buyPrice: 5, sellPrice: 1, currency: CurrencyType.Coin },
                { id: 1202, name: "Hạt Cà Rốt", description: "Cần tưới nước thường xuyên.", itemType: ItemType.Seed, isStackable: true, buyPrice: 12, sellPrice: 2, currency: CurrencyType.Coin },
                { id: 1203, name: "Hạt Cà Chua", description: "Sản lượng dồi dào khi chín.", itemType: ItemType.Seed, isStackable: true, buyPrice: 25, sellPrice: 5, currency: CurrencyType.Coin },
                { id: 1204, name: "Hạt Bí Ngô", description: "Lâu thu hoạch nhưng bán được giá.", itemType: ItemType.Seed, isStackable: true, buyPrice: 50, sellPrice: 10, currency: CurrencyType.Coin },
                { id: 1205, name: "Hạt Thảo Dược", description: "Nguyên liệu chế tạo thuốc hồi máu.", itemType: ItemType.Seed, isStackable: true, buyPrice: 100, sellPrice: 20, currency: CurrencyType.Coin },

                // ==========================================
                // 1301-1399: Crop (Consumable - Stackable: true)
                // ==========================================
                { id: 1301, name: "Lúa Mì", description: "Thu hoạch từ Hạt Lúa Mì.", itemType: ItemType.Consumable, isStackable: true, buyPrice: 15, sellPrice: 8, currency: CurrencyType.Coin },
                { id: 1302, name: "Cà Rốt Ngọt", description: "Hồi một ít máu khi ăn.", itemType: ItemType.Consumable, isStackable: true, buyPrice: 30, sellPrice: 18, currency: CurrencyType.Coin },
                { id: 1303, name: "Cà Chua Mọng", description: "Nguyên liệu nấu ăn tuyệt vời.", itemType: ItemType.Consumable, isStackable: true, buyPrice: 60, sellPrice: 35, currency: CurrencyType.Coin },
                { id: 1304, name: "Bí Ngô Khổng Lồ", description: "Rất nặng, giá trị dinh dưỡng cao.", itemType: ItemType.Consumable, isStackable: true, buyPrice: 150, sellPrice: 80, currency: CurrencyType.Coin },
                { id: 1305, name: "Thảo Dược Tươi", description: "Dùng để luyện kim hoặc hồi thương.", itemType: ItemType.Consumable, isStackable: true, buyPrice: 250, sellPrice: 140, currency: CurrencyType.Coin },

                // ==========================================
                // 1401-1499: Material (Material - Stackable: true)
                // ==========================================
                { id: 1401, name: "Nhánh Cây Gãy", description: "Thu thập từ việc đốn củi.", itemType: ItemType.Material, isStackable: true, buyPrice: 10, sellPrice: 2, currency: CurrencyType.Coin },
                { id: 1402, name: "Quặng Đồng Nhỏ", description: "Nguyên liệu rèn đúc cơ bản.", itemType: ItemType.Material, isStackable: true, buyPrice: 25, sellPrice: 5, currency: CurrencyType.Coin },
                { id: 1403, name: "Quặng Sắt Thô", description: "Cứng cáp, dùng để chế tạo vũ khí.", itemType: ItemType.Material, isStackable: true, buyPrice: 60, sellPrice: 12, currency: CurrencyType.Coin },
                { id: 1404, name: "Sợi Vải Rách", description: "Nhặt được từ quái vật hình người.", itemType: ItemType.Material, isStackable: true, buyPrice: 15, sellPrice: 3, currency: CurrencyType.Coin },
                { id: 1405, name: "Da Sói Dại", description: "Dùng để khâu giáp da.", itemType: ItemType.Material, isStackable: true, buyPrice: 40, sellPrice: 8, currency: CurrencyType.Coin },
            ];

            await itemRepo.save(items);
            console.log(`✅ Đã khởi tạo thành công ${items.length} vật phẩm gốc!`);
        } catch (error) {
            console.error("❌ Lỗi khi seed dữ liệu Item:", error);
        }
    }
}