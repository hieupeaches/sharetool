/* SHARETOOL – dữ liệu và tính toán dùng chung cho trang chính (index.html) và trang quản trị (quan-tri.html).
   Dữ liệu lưu trong localStorage của trình duyệt. Muốn dùng chung giữa nhiều máy: thay Store.load / Store.save
   bằng Firebase hoặc một máy chủ, phần còn lại giữ nguyên. */
(function () {
  const SITE = {
    zalo: "0900000000",            // số Zalo nhận đơn (chỉ dùng trong đường link zalo.me, không in ra trang)
    adminPassword: "sharetool2026",
    turnDays: 3,                   // một lượt thuê = 3 ngày
    maxTurns: 4,
    shipFee: 10000,                // phí giao tận phòng
    lowStock: 2
  };
  const PLACES = [
    { name: "Sảnh KTX khu A, ĐHQG TP.HCM", ship: false },
    { name: "Sảnh KTX khu B, ĐHQG TP.HCM", ship: false },
    { name: "ĐH Bách khoa, cơ sở Lý Thường Kiệt", ship: false },
    { name: "Giao tận phòng KTX hoặc phòng trọ", ship: true }
  ];
  const CATS = ["Cắt mô hình", "Dán mô hình", "Vẽ kỹ thuật"];

  /* Ảnh minh hoạ tạm (Unsplash), thay bằng ảnh chụp thật của SHARETOOL khi có */
  const PHOTOS = {
    hero:   { id: "photo-1738441639602-f6f2ff69a814", by: "Zach Camp", page: "https://unsplash.com/photos/a-green-cutting-mat-with-a-knife-and-a-pair-of-scissors-X1_817kEr48", alt: "Tấm lót cắt màu xanh có lưới, dao rọc và kéo đặt trên đó" },
    dao:    { id: "photo-1775938328020-1221e7e7ce8e", by: "Kedibone Isaac Makhumisane", page: "https://unsplash.com/photos/a-black-utility-knife-with-orange-accents-N6s_EQqO-C0", alt: "Dao rọc thân đen, chi tiết màu cam" },
    tamlot: { id: "photo-1743940185047-c1176f484664", by: "Rodrigo Araya", page: "https://unsplash.com/photos/a-green-grid-cutting-mat-with-white-lines-Lk3SKwvGs-w", alt: "Tấm lót cắt màu xanh với các đường lưới trắng" },
    thep:   { id: "photo-1789369136673-1d585b2cfa62", by: "Joachim Schnürle", page: "https://unsplash.com/photos/protractor-and-ruler-on-paper-du-ha_RgsN4", alt: "Thước kim loại và thước đo góc trên tờ giấy trắng" },
    keo:    { id: "photo-1775519686043-c177c2f12049", by: "Eric Stoynov", page: "https://unsplash.com/photos/hands-using-a-hot-glue-gun-on-an-orange-object-Q0F2oU26XG8", alt: "Tay cầm súng bắn keo nóng dán một chi tiết màu cam" },
    thuocT: { id: "photo-1662137263017-61395f6b6213", by: "Michael Myers", page: "https://unsplash.com/photos/diagram-engineering-drawing-pM8nxF7iW8I", alt: "Bản vẽ kỹ thuật trên bàn vẽ" },
    model:  { id: "photo-1772340163600-ae81082b02df", by: "Osmany M Leyva Aldana", page: "https://unsplash.com/photos/a-complex-cardboard-and-wood-architectural-model-CYE6DtHi4s4", alt: "Mô hình kiến trúc làm bằng bìa cứng và gỗ" },
    cat:    { id: "photo-1771440047967-710d191cae97", by: "Darien Attridge", page: "https://unsplash.com/photos/hands-using-a-craft-knife-to-cut-red-material-3crAKGsJ8pw", alt: "Tay dùng dao rọc cắt một tấm vật liệu màu đỏ" },
    ban:    { id: "photo-1776278798339-1c2c26dc9834", by: "Compagnons", page: "https://unsplash.com/photos/a-crafting-table-with-tools-and-supplies-TBtmHyW0R-w", alt: "Bàn làm thủ công với dụng cụ và vật liệu" },
    mohinh: { id: "photo-1653164579768-ea97833b3b03", by: "Fernando Andrade", page: "https://unsplash.com/photos/a-model-of-a-building-on-a-white-surface-XjNnftIsI-g", alt: "Mô hình một toà nhà đặt trên mặt bàn trắng" },
    matban: { id: "photo-1785740197239-b8cd838deba1", by: "Behnam Norouzi", page: "https://unsplash.com/photos/green-desk-mat-with-white-grid-and-rulers-7V04KKUgr0Q", alt: "Tấm lót cắt màu xanh có lưới trắng, đặt kèm thước" },
    lammh:  { id: "photo-1772442198907-765685249ea4", by: "GN Group", page: "https://unsplash.com/photos/man-working-on-architectural-model-at-desk-WUY0W2RSiBw", alt: "Người đang làm mô hình kiến trúc tại bàn" }
  };
  const img = (key, w) => PHOTOS[key] ? `https://images.unsplash.com/${PHOTOS[key].id}?auto=format&fit=crop&w=${w || 1600}&q=78` : "";

  const KEY = "sharetool_v3";
  /* ngày theo giờ máy người dùng (không dùng giờ UTC, để 6 giờ sáng ở Việt Nam vẫn là đúng ngày) */
  const addDays = (n, from) => {
    const d = from ? new Date(from + "T12:00:00") : new Date(); d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  function seed() {
    // Kho ban đầu 45 dụng cụ, theo Bài tập 5 – Phân tích khả thi tài chính SHARETOOL
    return {
      tools: [
        { id: "dao-roc", name: "Dao rọc Olfa A-1", cat: "Cắt mô hình", photo: "dao", spec: "Lưỡi 9 mm, thay lưỡi mới trước mỗi lượt", price: 30000, deposit: 100000, buy: 180000, total: 10, available: 6, restock: "", hidden: false, image: "" },
        { id: "tam-lot", name: "Tấm lót cắt A3", cat: "Cắt mô hình", photo: "tamlot", spec: "Tự liền vết cắt, có lưới đo 1 cm", price: 45000, deposit: 100000, buy: 200000, total: 9, available: 5, restock: "", hidden: false, image: "" },
        { id: "thuoc-thep", name: "Thước thép 60 cm", cat: "Cắt mô hình", photo: "thep", spec: "Thép không gỉ, để tì dao khi cắt thẳng", price: 40000, deposit: 100000, buy: 190300, total: 8, available: 2, restock: "", hidden: false, image: "" },
        { id: "sung-keo", name: "Súng bắn keo 60W", cat: "Dán mô hình", photo: "keo", spec: "Keo nến 11 mm, kèm 2 thỏi keo", price: 60000, deposit: 150000, buy: 242000, total: 8, available: 0, restock: addDays(2), hidden: false, image: "" },
        { id: "thuoc-t", name: "Thước T 60 cm", cat: "Vẽ kỹ thuật", photo: "thuocT", spec: "Kẻ đường song song trên bảng vẽ", price: 35000, deposit: 100000, buy: 120000, total: 10, available: 7, restock: "", hidden: false, image: "" }
      ],
      combos: [
        { id: "c-cat", name: "Combo cắt mô hình", photo: "cat", desc: "Cắt formex, bìa cứng cho mô hình đồ án.", parts: [{ id: "dao-roc", qty: 1 }, { id: "tam-lot", qty: 1 }, { id: "thuoc-thep", qty: 1 }], price: 100000, soon: false, hidden: false },
        { id: "c-dan", name: "Combo dán mô hình", photo: "ban", desc: "Dán chi tiết mà không làm keo nóng dính bàn.", parts: [{ id: "sung-keo", qty: 1 }, { id: "tam-lot", qty: 1 }], price: 90000, soon: false, hidden: false },
        { id: "c-chup", name: "Combo chụp sản phẩm", photo: "", desc: "Tripod điện thoại và đèn LED nhỏ để chụp mô hình nộp bài.", parts: [], price: 0, soon: true, hidden: false }
      ],
      orders: []
    };
  }
  const Store = {
    load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.tools) return d; } catch (e) {} return seed(); },
    save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }
  };

  const ST = {
    SITE, PLACES, CATS, PHOTOS, img, KEY, seed, Store, addDays,
    db: Store.load(),
    save() { return Store.save(this.db); },
    reload() { this.db = Store.load(); },
    vnd: n => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + "đ",
    esc: s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    date: s => s ? s.split("-").reverse().join("/") : "",
    uid: () => Math.random().toString(36).slice(2, 8),
    perDay: p => Math.round(p / SITE.turnDays / 100) * 100,
    tool(id) { return this.db.tools.find(t => t.id === id); },
    combo(id) { return this.db.combos.find(c => c.id === id); },
    tools() { return this.db.tools.filter(t => !t.hidden); },
    combos() { return this.db.combos.filter(c => !c.hidden); },
    toolImg(t, w) { return t.image || img(t.photo, w); },
    comboAvail(c) { if (c.soon || !c.parts.length) return 0; return Math.min(...c.parts.map(p => { const t = this.tool(p.id); return t && !t.hidden ? Math.floor(t.available / p.qty) : 0; })); },
    comboRetail(c) { return c.parts.reduce((a, p) => a + (this.tool(p.id)?.price || 0) * p.qty, 0); },
    comboBuy(c) { return c.parts.reduce((a, p) => a + (this.tool(p.id)?.buy || 0) * p.qty, 0); },
    comboDeposit(c) { return c.parts.reduce((a, p) => a + (this.tool(p.id)?.deposit || 0) * p.qty, 0); },
    line(l) {
      if (l.type === "tool") { const t = this.tool(l.id); return t && { name: t.name, price: t.price, deposit: t.deposit }; }
      const c = this.combo(l.id); return c && { name: c.name, price: c.price, deposit: this.comboDeposit(c) };
    },
    need(lines) {
      const n = {};
      lines.forEach(l => {
        if (l.type === "tool") n[l.id] = (n[l.id] || 0) + l.qty;
        else { const c = this.combo(l.id); c && c.parts.forEach(p => n[p.id] = (n[p.id] || 0) + p.qty * l.qty); }
      });
      return n;
    },
    fits(lines) { return Object.entries(this.need(lines)).every(([id, q]) => this.tool(id) && this.tool(id).available >= q); },
    stock(avail, restock) {
      if (avail <= 0) return { cls: "out", text: restock ? `Hết, có lại ${this.date(restock)}` : "Tạm hết" };
      if (avail <= SITE.lowStock) return { cls: "low", text: `Còn ${avail} cái` };
      return { cls: "ok", text: `Còn ${avail} cái` };
    }
  };
  window.ST = ST;
})();
