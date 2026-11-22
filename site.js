/* SHARETOOL – trang chính: vẽ kho dụng cụ, combo, so sánh giá và đơn thuê từ dữ liệu trong app.js */
(function () {
  const S = window.ST, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const { vnd, esc } = S;
  let CART = (() => { try { return JSON.parse(sessionStorage.getItem("st_cart")) || []; } catch (e) { return []; } })();
  const saveCart = () => { try { sessionStorage.setItem("st_cart", JSON.stringify(CART)); } catch (e) {} };

  /* ảnh: gắn đường dẫn Unsplash; nếu không tải được thì để nền trơn thay vì ảnh vỡ */
  function photo(el) {
    const key = el.dataset.photo, w = el.dataset.w || 1600;
    if (!key) return;
    el.src = S.img(key, w);
    el.srcset = `${S.img(key, Math.round(w / 2))} ${Math.round(w / 2)}w, ${S.img(key, w)} ${w}w`;
    el.sizes = el.closest(".hero__stage") ? "100vw" : "(min-width: 1024px) 50vw, 100vw";
    el.addEventListener("error", () => { el.removeAttribute("srcset"); el.setAttribute("data-fallback", ""); }, { once: true });
  }
  function photos(root) { (root || document).querySelectorAll("img[data-photo]").forEach(photo); }

  /* ---------- kho dụng cụ ---------- */
  function inCart(type, id) { return CART.find(l => l.type === type && l.id === id); }
  function renderTools() {
    const ts = S.tools(), ul = $("#toolRows");
    const inner = t => {
      const st = S.stock(t.available, t.restock), c = inCart("tool", t.id);
      return `<span class="rows__name">${esc(t.name)}</span>
        <p>${esc(t.spec)}. <span class="stock stock--${st.cls}">${st.text}</span></p>
        <span class="rows__value"><span data-assumed>${vnd(t.price)}</span>
          <button class="btn btn--secondary" type="button" data-add-tool="${t.id}" ${t.available <= 0 ? "disabled" : ""}>${c ? `Đã thêm ${c.qty}` : "Thêm vào đơn"}</button></span>`;
    };
    /* lần đầu dựng các hàng; sau đó chỉ thay nội dung bên trong để giữ hiệu ứng đổi ảnh của system.js */
    const rows = [...ul.children];
    if (rows.length === ts.length && rows.every((li, i) => li.dataset.peekTo === ts[i].id)) {
      rows.forEach((li, i) => { const keepFocus = li.contains(document.activeElement) && document.activeElement.dataset.addTool; li.innerHTML = inner(ts[i]); if (keepFocus) li.querySelector("[data-add-tool]")?.focus(); });
    } else {
      ul.innerHTML = ts.map(t => `<li data-peek-to="${t.id}" tabindex="0">${inner(t)}</li>`).join("");
    }
    const pics = $("#toolPics");
    if (!pics.dataset.done) {
      pics.innerHTML = ts.map((t, i) => t.image
        ? `<img class="frame__img" data-peek-for="${t.id}" src="${t.image}" alt="${esc(t.name)}" ${i ? "hidden" : ""}>`
        : `<img class="frame__img" data-peek-for="${t.id}" data-photo="${t.photo}" data-w="1400" alt="${esc(S.PHOTOS[t.photo]?.alt || t.name)}" ${i ? "hidden" : ""} loading="lazy" data-source="shoot" data-subject="${esc(t.name)}">`).join("");
      photos(pics); pics.dataset.done = "1";
    }
  }

  /* ---------- combo ---------- */
  function renderCombos() {
    const cs = S.combos(), live = cs.filter(c => !c.soon), soon = cs.filter(c => c.soon);
    $("#comboSoon").textContent = soon.length ? `${soon.map(c => c.name).join(", ")} sẽ có khi kho mở rộng.` : "";
    const span = live.length >= 3 ? 4 : 6;
    $("#comboTiles").innerHTML = live.map(c => {
      const av = S.comboAvail(c), retail = S.comboRetail(c), inC = inCart("combo", c.id), ph = c.photo || S.tool(c.parts[0]?.id)?.photo || "hero";
      const parts = c.parts.map(p => (p.qty > 1 ? p.qty + " " : "") + (S.tool(p.id)?.name || "")).join(", ");
      return `<article class="tile span-${span}">
        <div class="tile__media"><img data-photo="${ph}" data-w="1200" alt="${esc(S.PHOTOS[ph]?.alt || c.name)}" loading="lazy" data-source="shoot" data-subject="${esc(c.name)}"></div>
        <div class="tile__head"><h3>${esc(c.name)}</h3><span class="tile__price" data-assumed>${vnd(c.price)} một lượt</span></div>
        <p class="tile__facts">${esc(parts)}. Cọc ${vnd(S.comboDeposit(c))}.</p>
        <p>${esc(c.desc)} Thuê lẻ ba món là ${vnd(retail)}. <span class="stock stock--${av > 0 ? (av <= 2 ? "low" : "ok") : "out"}">${av > 0 ? `Còn ghép được ${av} combo` : "Tạm hết"}</span></p>
        <button class="btn btn--secondary" type="button" data-add-combo="${c.id}" ${av <= 0 ? "disabled" : ""}>${inC ? `Đã thêm ${inC.qty}` : "Thêm vào đơn"}</button>
      </article>`.replace("Thuê lẻ ba món", c.parts.length === 3 ? "Thuê lẻ ba món" : c.parts.length === 2 ? "Thuê lẻ hai món" : "Thuê lẻ");
    }).join("");
    photos($("#comboTiles"));
  }

  /* ---------- so sánh giá ---------- */
  function renderCompare() {
    const c = S.combo("c-cat"); if (!c || c.soon) return;
    const buy = S.comboBuy(c);
    $("#cmpPct").textContent = buy ? Math.round((1 - c.price / buy) * 100) + "%" : "";
    $("#cmpRows").innerHTML = `
      <li><span class="rows__name">Mua mới dao rọc, tấm lót cắt, thước thép</span><span class="rows__value">${vnd(buy)}</span></li>
      <li><span class="rows__name">Thuê ${esc(c.name.toLowerCase())}, 1 lượt 3 ngày</span><span class="rows__value" data-assumed>${vnd(c.price)}</span></li>
      <li><span class="rows__name">Thuê 2 lượt, 6 ngày</span><span class="rows__value" data-assumed>${vnd(c.price * 2)}</span></li>`;
  }

  /* ---------- đơn thuê ---------- */
  const turns = () => +$("#f-turns").value || 1;
  function calc() {
    const tn = turns(), place = S.PLACES[$("#f-place").selectedIndex - 1];
    const rent = CART.reduce((a, l) => a + (S.line(l)?.price || 0) * l.qty * tn, 0);
    const dep = CART.reduce((a, l) => a + (S.line(l)?.deposit || 0) * l.qty, 0);
    const ship = place && place.ship && CART.length ? S.SITE.shipFee : 0;
    const from = $("#f-from").value, to = from ? S.addDays(tn * S.SITE.turnDays, from) : "";
    return { tn, rent, dep, ship, from, to, place };
  }
  function renderOrder() {
    const c = calc();
    $("#orderLines").innerHTML = CART.length ? CART.map((l, i) => {
      const f = S.line(l); if (!f) return "";
      return `<li><span>${esc(f.name)}</span><span>${vnd(f.price * l.qty * c.tn)}</span>
        <small>${vnd(f.price)} × ${l.qty} × ${c.tn} lượt</small>
        <span class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="Bớt một ${esc(f.name)}">−</button><button type="button" data-q="${i}" data-d="1" aria-label="Thêm một ${esc(f.name)}">+</button></span></li>`;
    }).join("") : `<li><span class="order__empty">Đơn chưa có món nào. Chọn ở <a class="link" href="#kho">kho dụng cụ</a> hoặc <a class="link" href="#combo">combo</a>.</span></li>`;
    $("#orderSum").innerHTML = `
      <dt>Thời gian</dt><dd>${c.from ? `${S.date(c.from)} đến ${S.date(c.to)}` : `${c.tn * S.SITE.turnDays} ngày`}</dd>
      <dt>Tiền thuê</dt><dd>${vnd(c.rent)}</dd>
      ${c.ship ? `<dt>Phí giao tận phòng</dt><dd>${vnd(c.ship)}</dd>` : ""}
      <dt>Tiền cọc, hoàn lại khi trả</dt><dd>${vnd(c.dep)}</dd>
      <dt>Trả khi nhận đồ</dt><dd class="order__total">${vnd(c.rent + c.dep + c.ship)}</dd>`;
    const n = CART.reduce((a, l) => a + l.qty, 0), badge = $("[data-cart-n]");
    if (badge) { badge.hidden = !n; badge.textContent = n ? ` (${n})` : ""; }
  }
  function refresh() { CART = CART.filter(l => S.line(l)); saveCart(); renderTools(); renderCombos(); renderOrder(); }
  function say(t) { $("#bookForm [data-form-status]").textContent = t; }
  function add(type, id) {
    const trial = CART.map(l => ({ ...l })), ex = trial.find(l => l.type === type && l.id === id);
    if (ex) ex.qty++; else trial.push({ type, id, qty: 1 });
    const name = S.line({ type, id }).name;
    if (!S.fits(trial)) { say(`Kho không còn đủ ${name}.`); return; }
    CART = trial; refresh(); say(`Đã thêm ${name} vào đơn thuê.`);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-add-tool]"); if (a) { add("tool", a.dataset.addTool); return; }
    const b = e.target.closest("[data-add-combo]"); if (b) { add("combo", b.dataset.addCombo); return; }
    const q = e.target.closest("[data-q]");
    if (q) {
      const trial = CART.map(l => ({ ...l })), i = +q.dataset.q; trial[i].qty += +q.dataset.d;
      if (trial[i].qty <= 0) trial.splice(i, 1); else if (!S.fits(trial)) { say("Kho không còn đủ để tăng số lượng."); return; }
      CART = trial; refresh();
    }
  });

  const form = $("#bookForm");
  $("#f-turns").innerHTML = [...Array(S.SITE.maxTurns)].map((_, i) => `<option value="${i + 1}">${i + 1} lượt, ${(i + 1) * S.SITE.turnDays} ngày</option>`).join("");
  $("#f-place").innerHTML += S.PLACES.map(p => `<option>${esc(p.name)}</option>`).join("");
  $("#f-from").min = S.addDays(0); $("#f-from").value = S.addDays(0);
  form.addEventListener("input", renderOrder); form.addEventListener("change", renderOrder);
  /* chạy sau phần kiểm tra ô của system.js: ô nào sai thì system.js đã báo, ở đây chỉ ghi đơn khi mọi ô đều đúng */
  form.addEventListener("submit", e => {
    if (!form.checkValidity()) return;
    e.preventDefault();
    if (!CART.length) { say("Đơn chưa có món nào. Thêm dụng cụ hoặc combo trước khi gửi."); return; }
    if (!S.fits(CART)) { say("Một số món vừa hết. Giảm số lượng trong đơn rồi gửi lại."); refresh(); return; }
    const c = calc();
    const o = { id: S.uid(), created: new Date().toISOString(), lines: CART.map(l => ({ ...l, name: S.line(l).name, price: S.line(l).price })),
      turns: c.tn, from: c.from, to: c.to, place: c.place.name, rent: c.rent, deposit: c.dep, ship: c.ship,
      name: $("#f-name").value.trim(), phone: $("#f-zalo").value.trim(), status: "Mới" };
    S.reload(); S.db.orders.unshift(o);
    if (!S.save()) { say("Chưa ghi được đơn vì bộ nhớ trình duyệt đã đầy. Nhắn Zalo cho SHARETOOL để đặt."); return; }
    /* system.js kiểm tra ô sau trình nghe này: đợi nó xong rồi mới xoá form và báo đã ghi đơn */
    setTimeout(() => {
      CART = []; form.reset(); $("#f-from").value = S.addDays(0); refresh();
      say(`Đơn thuê ${o.id.toUpperCase()} đã được ghi lại. SHARETOOL nhắn Zalo số ${o.phone} trong vòng 2 giờ. Trả đồ muộn nhất ngày ${S.date(o.to)}.`);
    }, 0);
  });

  /* ---------- liên kết Zalo, ghi công ảnh ---------- */
  $$("[data-zalo]").forEach(a => a.href = `https://zalo.me/${S.SITE.zalo}`);
  const used = [];


  photos();
  refresh();
  addEventListener("storage", e => { if (e.key === S.KEY) { S.reload(); refresh(); } });
})();
