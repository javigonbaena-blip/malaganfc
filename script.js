/* ============================================================
   Málaga NFC — interactividad (sin dependencias, editable)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Datos de producto ---------- */
  const PRODUCTS = {
    flip: {
      name: "Flip · negra y blanca",
      images: ["assets/flip-nueva.png"],
      ratio: 432 / 437,
      payhip: "https://payhip.com/b/JGma0",
      packs: [
        { n: 10, unit: "3,80", price: 38.00, tag: "" },
        { n: 30, unit: "3,20", price: 96.00, tag: "Recomendado" },
        { n: 50, unit: "2,80", price: 140.00, tag: "Mejor precio" }
      ]
    },
    adhesiva: {
      name: "Adhesiva · placa cuadrada",
      images: ["assets/adhesiva-nueva.png"],
      ratio: 271 / 292,
      payhip: "https://payhip.com/b/2YSR7",
      packs: [
        { n: 5, unit: "5,59", price: 27.95, tag: "" },
        { n: 10, unit: "4,50", price: 44.99, tag: "Recomendado" },
        { n: 20, unit: "3,75", price: 74.99, tag: "Mejor precio" }
      ]
    },
    soporte: {
      name: "Soporte · negro/blanco",
      images: ["assets/stand-nueva.png"],
      ratio: 456 / 340,
      payhip: "https://payhip.com/b/JH831",
      packs: [
        { n: 5, unit: "6,00", price: 29.99, tag: "" },
        { n: 10, unit: "4,80", price: 47.95, tag: "Recomendado" },
        { n: 20, unit: "4,00", price: 79.99, tag: "Mejor precio" }
      ]
    }
  };

  const money = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let currentModel = "flip";

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- Header: sombra al hacer scroll ---------- */
  window.addEventListener("scroll", () => {
    $("#siteHeader").classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  /* ---------- Menú móvil ---------- */
  const drawer = $("#drawer"), drawerBackdrop = $("#drawerBackdrop");
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    drawerBackdrop.hidden = !open;
  }
  $("#menuToggle").addEventListener("click", () => setDrawer(true));
  $("#drawerClose").addEventListener("click", () => setDrawer(false));
  drawerBackdrop.addEventListener("click", () => setDrawer(false));
  $$("#drawer a").forEach(a => a.addEventListener("click", () => setDrawer(false)));

  /* ---------- Pestañas de producto: precios + enlace a Payhip ---------- */
  const mainImg = $("#mainProductImg");
  const thumbs = $("#thumbs");

  function renderProduct() {
    const p = PRODUCTS[currentModel];

    // pestañas activas
    $$("#productTabs button").forEach(b => {
      const on = b.dataset.model === currentModel;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });

    // imagen principal + miniaturas
    mainImg.src = p.images[0];
    mainImg.alt = p.name;

    // el marco se ciñe a la proporción real de cada foto (el soporte no cambia)
    const frame = $("#mediaFrame");
    frame.style.aspectRatio = String(p.ratio);
    frame.style.maxWidth = Math.round(440 * p.ratio) + "px";

    thumbs.hidden = p.images.length <= 1;
    thumbs.innerHTML = "";
    p.images.forEach((src, i) => {
      const img = document.createElement("img");
      img.src = src; img.alt = "Vista " + (i + 1);
      if (i === 0) img.classList.add("active");
      img.addEventListener("click", () => {
        mainImg.src = src;
        $$("#thumbs img").forEach(t => t.classList.remove("active"));
        img.classList.add("active");
      });
      thumbs.appendChild(img);
    });

    // precios informativos: la elección real se hace en Payhip
    $("#priceInfo").innerHTML = p.packs.map(pack => `
      <div class="price-row-info${pack.tag === "Mejor precio" ? " best" : ""}">
        <span>${pack.n} tarjetas${pack.tag ? ` <em>${pack.tag}</em>` : ""}</span>
        <small>${pack.unit} €/ud.</small>
        <strong>${money(pack.price)}</strong>
      </div>`).join("") +
      `<p class="variant-note">${currentModel === "flip"
        ? "En Payhip eliges Con QR o Sin QR."
        : currentModel === "soporte"
          ? "En Payhip eliges el color: Negro o Blanco."
          : "En Payhip eliges la cantidad del pack."}</p>`;

    const buyBtn = $("#buyBtn");
    buyBtn.href = p.payhip;
    buyBtn.textContent = "Comprar " + p.name.split(" · ")[0] + " en Payhip";
  }

  $$("#productTabs button").forEach(b => {
    b.addEventListener("click", () => { currentModel = b.dataset.model; renderProduct(); });
  });

  /* ---------- Formularios: envío real a través de FormSubmit ---------- */
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/malaganfc@gmail.com";
  const CONTACT_EMAIL = "malaganfc@gmail.com";

  async function sendForm(form, msgEl, extra, okText) {
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
    msgEl.className = "form-msg";
    msgEl.textContent = "Enviando…";

    const data = { _captcha: "false", _template: "table" };
    new FormData(form).forEach((value, key) => { data[key] = value; });
    Object.assign(data, extra);

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      });
      let result = {};
      try { result = await response.json(); } catch (_) { /* respuesta no JSON */ }
      if (!response.ok) throw new Error(result.message || "Error al enviar");
      msgEl.className = "form-msg ok";
      msgEl.textContent = okText;
      form.reset();
    } catch (err) {
      msgEl.className = "form-msg err";
      msgEl.textContent = "No se pudo enviar. Inténtalo de nuevo o escribe a " + CONTACT_EMAIL + ".";
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  }

  $("#distributorForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.reportValidity()) return;
    sendForm(form, $("#distributorMsg"),
      { _subject: "Solicitud de distribuidor — Málaga NFC" },
      "✓ Solicitud enviada. Te responderemos pronto.");
  });

  $("#newsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target, msg = $("#newsMsg"), email = $("#newsEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msg.className = "form-msg err"; msg.textContent = "Introduce un email válido."; return;
    }
    sendForm(form, msg,
      { _subject: "Nueva suscripción — Málaga NFC", email: email, mensaje: "Alta en novedades de Málaga NFC" },
      "✓ ¡Listo! Te avisaremos de novedades.");
  });

  /* ---------- Demo de "Publicar reseña" ---------- */
  $(".demo-publish").addEventListener("click", () => toast("¡Reseña publicada! (demo)"));

  /* ---------- Enlaces legales: abren su acordeón ---------- */
  const LEGAL_IDS = ["envios", "devoluciones", "privacidad", "terminos", "legal"];

  function openLegalId(id) {
    const target = document.getElementById(id);
    if (!target || target.tagName !== "DETAILS") return;
    LEGAL_IDS.forEach(other => {
      if (other !== id) {
        const el = document.getElementById(other);
        if (el) el.open = false;
      }
    });
    target.open = true;
  }

  function openLegalFromHash() {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (LEGAL_IDS.includes(id)) openLegalId(id);
  }

  $$('a[href^="#"]').forEach(link => {
    const id = link.getAttribute("href").slice(1);
    if (LEGAL_IDS.includes(id)) link.addEventListener("click", () => openLegalId(id));
  });
  window.addEventListener("hashchange", openLegalFromHash);
  openLegalFromHash();

  /* ---------- Init ---------- */
  renderProduct();
})();
