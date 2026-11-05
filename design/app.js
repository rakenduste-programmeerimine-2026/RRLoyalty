// Gustavi rada prototype. Screens are plain HTML strings, routed by the URL hash.
// Everything below is sample data: replace it with the real Rahvaraamat data later.

const member = { name: "Mari", points: 52, unopenedPerks: 1, pointsExpire: "[KUUPÄEV]" };

const RAIL_END = 400;
const stops = [
  { at: 50, label: "Tasuta kuum jook" },
  { at: 100, label: "5 € kinkekaart või annetus" },
  { at: 150, label: "Äpp 5 € (uutele)" },
  { at: 200, label: "5 € kinkekaart või annetus" },
  { at: 250, label: "Topelt-punktid" },
  { at: 300, label: "5 € kinkekaart või annetus" },
  { at: 350, label: "Tasuta pakiautomaat 15 €+" },
  { at: 400, label: "5 € kinkekaart või annetus" },
];

const recentPoints = [
  { date: "12.09", where: "E-pood · nimepäeva ost", points: 18 },
  { date: "03.09", where: "Literaat Telliskivi", points: 9 },
  { date: "28.08", where: "Äpi tellimus", points: 14 },
  { date: "15.08", where: "Kauplus Viru Keskus", points: 11 },
];

const accountLinks = [
  "Minu andmed", "Tellimused", "Gustavi rada", "Kinkekaardid",
  "Annetused", "Wallet-kaart", "Uudiskirjad",
];

const nextStop = stops.find((stop) => stop.at > member.points);
const pointsToNext = nextStop ? nextStop.at - member.points : 0;

// ---------- Small building blocks ----------

const placeholder = (text, className = "") =>
  `<div class="placeholder ${className}">${text}</div>`;

const notWired = (label, className = "btn") =>
  `<button type="button" class="${className}" data-action="not-wired">${label}</button>`;

const phone = ({ bar, back, body, foot = "", bodyClass = "" }) => `
  <article class="phone">
    <header class="phone__bar">${back ? `<a href="#/${back}">‹ ${bar}</a>` : bar}</header>
    <div class="phone__body ${bodyClass}">${body}</div>
    ${foot ? `<footer class="phone__foot">${foot}</footer>` : ""}
  </article>`;

const bookCard = (price) => `
  <a class="book-card" href="#/raamat">
    ${placeholder("[Kaas]")}
    <b>[Raamatu pealkiri]</b>
    <span>Mari [Perekonnanimi]</span>
    <strong>${price}</strong>
  </a>`;

const GUSTAV = `
  <svg viewBox="0 0 72 96" aria-hidden="true">
    <path d="M38 87c9 2 19 2 29 0 4-1 4 5 0 6-10 2-20 2-30 0z" />
    <ellipse cx="24" cy="66" rx="19" ry="26" />
    <path d="M8 24 9 4l13 10h4l13-10 1 20z" />
    <circle cx="24" cy="26" r="16" />
    <circle class="eye" cx="18" cy="24" r="2.4" />
    <circle class="eye" cx="30" cy="24" r="2.4" />
    <ellipse cx="17" cy="91" rx="7" ry="4.5" />
    <ellipse cx="32" cy="91" rx="7" ry="4.5" />
  </svg>`;

function rail(points) {
  const toPercent = (value) => `${(value / RAIL_END) * 100}%`;

  const stopItem = (stop) => {
    const isOpen = stop.at <= points;
    const isNext = stop === nextStop;
    const state = isOpen ? "✓ Avatud" : isNext ? `veel ${stop.at - points} p` : "";
    const modifier = isOpen ? "stop--open" : isNext ? "stop--next" : "";
    return `
      <li class="stop ${modifier}" style="--at:${toPercent(stop.at)}">
        <span class="stop__dot">${stop.at}</span>
        <span class="stop__label">${stop.label}</span>
        ${state ? `<span class="stop__state">${state}</span>` : ""}
      </li>`;
  };

  return `
    <div class="rail-scroll" tabindex="0" role="group" aria-label="Gustavi rada: ${points} punkti">
      <div class="rail" style="--pos:${toPercent(points)}">
        <div class="rail__track">
          <div class="rail__fill"></div>
          <span class="rail__start"></span>
          <span class="rail__start-label">Start</span>
          <div class="gustav">${GUSTAV}</div>
          ${nextStop ? `<div class="bubble">Veel ${pointsToNext} p järgmise peatuseni</div>` : ""}
          <ol>${stops.map(stopItem).join("")}</ol>
        </div>
        <div class="rail__spacer"></div>
      </div>
    </div>`;
}

// ---------- Screens ----------

const screens = {
  "e-nimepaev": {
    title: "E-mail, happy nameday",
    render: () => phone({
      bar: "Postkast",
      body: `
        ${placeholder("[Gustav kassi illustratsioon]", "hero")}
        <h1>Palju õnne nimepäevaks, ${member.name}!</h1>
        <p class="sub">Täna saad −10% kõigilt raamatutelt, mille autor on sinu nimekaim.</p>
        <p class="note">Kehtib kuni [KUUPÄEV] e-poes ja kauplustes klubikaardiga.</p>`,
      foot: `<a class="btn" href="#/nimekaimud">Vaata nimekaimude raamatuid</a>`,
    }),
  },

  nimekaimud: {
    title: "List of the same name authors",
    render: () => phone({
      bar: "Minu konto",
      back: "rada",
      body: `
        <h1>Sinu nimekaimud</h1>
        <p class="note note--strong">Nimepäeva −10% kuni [KUUPÄEV]</p>
        <div class="book-grid">
          ${bookCard("20,00 € → 18,00 €")}
          ${bookCard("[HIND] → [HIND −10%]")}
          ${bookCard("[HIND] → [HIND −10%]")}
          ${bookCard("[HIND] → [HIND −10%]")}
        </div>
        ${notWired(`Ei leidnud sobivat? Vaata raamatuid, kus tegelase nimi on ${member.name} ›`, "link-card")}`,
    }),
  },

  raamat: {
    title: "Book page, −10%",
    render: () => phone({
      bar: "Sinu nimekaimud",
      back: "nimekaimud",
      body: `
        ${placeholder("[Raamatu kaas]", "cover")}
        <h1>[Raamatu pealkiri]</h1>
        <p class="sub">Mari [Perekonnanimi]</p>
        <p class="price">20,00 € → 18,00 € (Nimepäeva −10%)</p>
        <p class="sub">Soodushind kehtib sisselogituna ja kassas klubikaardiga.</p>`,
      foot: `<a class="btn" href="#/ostukorv">Lisa ostukorvi</a>`,
    }),
  },

  ostukorv: {
    title: "Bag",
    render: () => phone({
      bar: "Ostukorv",
      back: "raamat",
      body: `
        <div class="cart-line">[Raamatu pealkiri]<br />Mari [Perekonnanimi] · 1 tk</div>
        <div class="sum">
          <div><span>Hind</span><span>20,00 €</span></div>
          <div><span>Nimepäeva soodustus −10%</span><span>−2,00 €</span></div>
          <div class="total"><span>Kokku</span><span>18,00 €</span></div>
        </div>
        <div class="note note--strong gain">
          <span>+18 punkti Gustavi rajale</span>
          <div class="gain__meter">
            <div class="meter"><span style="width:64%"></span></div>
            <span>32 / 50</span>
          </div>
          <span>Pärast ostu: 32 punkti. Veel 18 € ja jõuad järgmise peatusse: tasuta kohv.</span>
        </div>`,
      foot: `
        <a class="textlink" href="#/rada">Vaata Gustavi rada</a>
        ${notWired("Maksa 18,00 €")}`,
    }),
  },

  "e-100p": {
    title: "E-mail, 100 points",
    render: () => phone({
      bar: "Postkast",
      body: `
        ${placeholder("[Gustav 100 p peatuses]", "hero")}
        <h1>Sul on 100 punkti – vali oma tasu</h1>
        <p class="sub">Vali 3 päeva jooksul: 5 € kinkekaart endale või 5 € annetus kooliraamatukogule.</p>
        <p class="note">Kui sa ei vali, saad kinkekaardi automaatselt 3 päeva jooksul.</p>`,
      foot: `<a class="btn" href="#/tasu">Vali tasu</a>`,
    }),
  },

  tasu: {
    title: "Choose your prize",
    render: () => phone({
      bar: "Gustavi rada",
      back: "rada",
      body: `
        <h1>Vali oma 100 punkti tasu</h1>
        <p class="sub">Aega valida: 3 päeva</p>
        <label class="choice">
          <input type="radio" name="prize" value="kinkekaart" checked />
          <span><b>5 € kinkekaart</b>Kehtib 60 päeva, ostul alates 20 €.</span>
        </label>
        <label class="choice">
          <input type="radio" name="prize" value="annetus" />
          <span><b>Anneta 5 € kooliraamatukogule</b>Rahva Raamat annab raamatud [KOOLI NIMI] raamatukogule.</span>
        </label>`,
      foot: `<button type="button" class="btn" data-action="confirm-prize">Kinnita valik</button>`,
    }),
  },

  kinkekaart: {
    title: "Gift card",
    render: () => phone({
      bar: "Gustavi rada",
      back: "rada",
      bodyClass: "center",
      body: `
        <h1>5 € kinkekaart on sinu!</h1>
        ${placeholder("[QR-kood]", "qr")}
        <p class="code">[KOOD]</p>
        <p class="sub">kehtib kuni 01.12.2026 · ostul alates 20 €</p>`,
      foot: `
        <a class="btn btn--ghost" href="#/rada">Tagasi rajale</a>
        ${notWired("Lisa walletisse")}`,
    }),
  },

  annetus: {
    title: "Donation",
    render: () => phone({
      bar: "Gustavi rada",
      back: "rada",
      bodyClass: "center",
      body: `
        ${placeholder("[Gustav raamatuhunnikuga]", "hero")}
        <h1>Aitäh!</h1>
        <p class="sub">Sinu 5 € läheb [KOOLI NIMI] raamatukogule.</p>
        <p class="sub">Annetuste kokkuvõtte saad aasta lõpus e-kirjaga.</p>`,
      foot: `
        <a class="btn btn--ghost" href="#/rada">Tagasi rajale</a>
        ${notWired("Jaga sõpradega")}`,
    }),
  },

  rada: {
    title: "Gustavi rada",
    render: () => `
      <div class="browser">
        <div class="browser__chrome"><i></i><i></i><i></i><span>rahvaraamat.ee/konto/gustavi-rada</span></div>
        <div class="site">
          <header class="site__top">
            ${placeholder("[Rahva Raamat]", "logo")}
            <div class="search">Otsi raamatut, autorit…</div>
            <nav class="site__nav" aria-label="Põhimenüü">
              ${["Raamatud", "E-raamatud", "Äpp", "Literaat", "Kauplused"]
                .map((item) => `<a href="#/rada">${item}</a>`).join("")}
            </nav>
            <div class="site__user">${member.name} ▾<small>Ostukorv (0)</small></div>
          </header>
          <div class="site__layout">
            <nav class="side" aria-label="Minu konto">
              <h2>Minu konto</h2>
              <ul>
                ${accountLinks.map((item) => `
                  <li><a href="#/rada"${item === "Gustavi rada" ? ' aria-current="page"' : ""}>${item}</a></li>`).join("")}
              </ul>
            </nav>
            <main class="main">
              <div>
                <h1>Gustavi rada</h1>
                <p class="lede">Iga 1 € = 1 punkt – kauplustes, e-poes, Literaadis ja äpis. Peatusel avaneb hüve.</p>
              </div>
              <div class="stats">
                <div class="stat"><b>${member.points}</b><span>punkti kogutud</span></div>
                <div class="stat"><b>${pointsToNext} p</b><span>järgmise peatuseni (${nextStop.at} p)</span></div>
                <div class="stat"><b>${member.unopenedPerks}</b><span>avamata hüve</span></div>
                <div class="stat"><b>${member.pointsExpire}</b><span>punktid kehtivad kuni</span></div>
              </div>
              ${rail(member.points)}
              <div class="panels">
                <section class="perk">
                  <small>Avatud hüve</small>
                  <h2>Tasuta kuum jook</h2>
                  <p>Kehtib 60 päeva – kuni 01.12.2026.<br />
                    Literaat Telliskivi · Viru Keskus · Vanalinn<br />
                    Kauplused: Võru, Jõhvi, Kuressaare</p>
                  <div class="perk__actions">
                    ${notWired("Näita QR-koodi", "btn btn--auto")}
                    ${notWired("Vali hoopis nädal tasuta äpis", "textlink")}
                  </div>
                </section>
                <section class="history">
                  <h2>Viimased punktid</h2>
                  <ul>
                    ${recentPoints.map((row) => `
                      <li><time>${row.date}</time><span>${row.where}</span><b>+${row.points} p</b></li>`).join("")}
                  </ul>
                  ${notWired("[Näita rohkem]", "textlink")}
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>`,
  },
};

// ---------- Prototype shell ----------

const frame = (id) => `
  <div class="frame">
    <h3>${screens[id].title}</h3>
    ${screens[id].render()}
  </div>`;

const arrow = (label) => `<div class="arrow">${label}</div>`;

const protoBar = (right) => `
  <div class="proto-bar"><b>Gustavi rada · prototüüp</b>${right}</div>`;

function board() {
  return `
    ${protoBar("<span>Klõpsa nuppe, et voogu läbida</span>")}
    <div class="board">
      <section class="flow">
        <h2>Nimepäev</h2>
        <div class="flow__row">
          ${frame("e-nimepaev")}${arrow("Vaata nimekaimude raamatuid")}
          ${frame("nimekaimud")}${arrow("Vali raamat")}
          ${frame("raamat")}${arrow("Lisa ostukorvi")}
          ${frame("ostukorv")}
        </div>
      </section>
      <section class="flow">
        <h2>100 punkti tasu</h2>
        <div class="flow__row">
          ${frame("e-100p")}${arrow("Vali tasu")}
          ${frame("tasu")}${arrow("Kinkekaart")}
          ${frame("kinkekaart")}${arrow("või annetus")}
          ${frame("annetus")}
        </div>
      </section>
      <section class="flow">
        <h2>Gustavi rada</h2>
        ${screens.rada.render()}
      </section>
    </div>`;
}

function solo(id) {
  const isPhone = id !== "rada";
  return `
    ${protoBar('<a href="#/">← Kõik ekraanid</a>')}
    <div class="solo ${isPhone ? "solo--phone" : ""}">${screens[id].render()}</div>`;
}

function route() {
  const id = location.hash.replace("#/", "");
  document.getElementById("app").innerHTML = screens[id] ? solo(id) : board();
  scrollTo(0, 0);
}

let toastTimer;
function toast(message) {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("is-on"), 1800);
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;

  if (trigger.dataset.action === "not-wired") {
    toast("Seda prototüübis veel pole");
  }
  if (trigger.dataset.action === "confirm-prize") {
    const screen = trigger.closest(".phone");
    location.hash = `#/${screen.querySelector('input[name="prize"]:checked').value}`;
  }
});

addEventListener("hashchange", route);
route();
