const elements = {
  peopleCount: document.querySelector(".people b"),
  profilePics: document.querySelector(".people .pfps"),
  loadingText: document.querySelector(".loading_text"),
  loader: document.querySelector(".loader"),
  main: document.querySelector(".main"),
  input: document.querySelector(".form input"),
  submit: document.querySelector(".submit"),
  error: document.querySelector(".error"),
};

const phrases = [
  "Searching for your profile...",
  "Analyzing your profile...",
  "Running AI model...",
  "Generating statistics...",
  "Gathering information...",
  "Searching your tweets...",
];

let lastCount = 0;
let loaderInterval;

(async function () {
  const pfps = await (await fetch("/api/pfps")).json();

  elements.profilePics.innerHTML = pfps.pfps.map((pfp) => `<img src="${pfp}">`).join("");
})();

async function updateUsage() {
  const usage = await (await fetch("/api/usage")).json();

  if (lastCount === usage.count) return;
  lastCount = usage.count;

  elements.peopleCount.innerText = usage.count.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
}

setInterval(updateUsage, 3500);
updateUsage();

function startLoader() {
  let index = 0;

  function updateText() {
    elements.loadingText.style.opacity = 0;
    setTimeout(() => {
      elements.loadingText.innerText = phrases[index % phrases.length];
      elements.loadingText.style.opacity = 1;
      index++;
    }, 600);
  }

  updateText();
  loaderInterval = setInterval(updateText, 3000);
}

elements.input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") elements.submit.click();
});

elements.input.addEventListener("input", (e) => {
  if (elements.input.value.trim()) {
    elements.submit.disabled = false;
    return;
  }
  elements.submit.disabled = true;
});

document.querySelector(".error .back").addEventListener("click", function () {
  elements.main.style.display = "block";
  elements.error.style.display = "none";
});

document.querySelector("#floating").addEventListener("solve", async function (e) {
  const user = elements.input.value.trim().replace(/@|x\.com\/|https?:\/\//g, "");

  if (!user.trim()) {
    elements.error.style.display = "block";
    elements.main.style.display = "none";
    return;
  }

  elements.loader.style.display = "block";
  elements.main.style.display = "none";

  startLoader();

  const results = await (
    await fetch("/api/analyze", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user,
        token: e.detail.token,
      }),
    })
  ).json();

  try {
    plausible("analyze", {
      props: {
        user,
      },
    });
  } catch {}

  clearInterval(loaderInterval);
  elements.loader.style.display = "none";

  if (results.needsFollowing) {
    clearInterval(loaderInterval);
    return;
  }

  if (results.invalidUser || !results.id) {
    elements.error.style.display = "block";
    return;
  }

  location.href = `/results/${results.id}`;
});

async function fetchAuraBoard() {
  const data = await (
    await fetch("https://corsproxy.io/?url=https://twt.tiagorangel.com/api/auraboard")
  ).json();

  document.querySelector(
    "#updated"
  ).innerHTML = `Last updated ${data.updated}<br>(updates every hour)`;
  renderList("#top", data.top.slice(0, 10));
  renderList("#top2", data.top.slice(-10));
}

function renderList(selector, items) {
  const container = document.querySelector(selector);
  container.innerHTML = "";

  items.forEach(({ link, pfp, username, aura, rank }) => {
    const el = document.createElement("a");
    el.href = `https://twt.tiagorangel.com${link}`;
    el.target = "_blank";
    el.className = "user";

    el.addEventListener("click", (e) => {
      try {
        plausible("auraboard-click", {
          props: {
            user: username,
            rank,
          },
        });
      } catch {}
    });

    const img = document.createElement("img");
    img.src = pfp;
    img.alt = username;
    img.addEventListener("error", () => {
      img.src = "/assets/nopfp.svg";
    });

    const rankEl = document.createElement("p");
    rankEl.classList.add("rank");
    rankEl.textContent = rank;

    const name = document.createElement("p");
    name.classList.add("username");
    name.textContent = username;

    const auraSpan = document.createElement("span");
    auraSpan.textContent = `${aura} aura`;

    el.append(img, rankEl, name, auraSpan);
    container.appendChild(el);
  });
}

fetchAuraBoard();
