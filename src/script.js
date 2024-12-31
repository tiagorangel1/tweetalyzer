import * as htmlToImage from "https://esm.run/html-to-image";

const input = document.querySelector(".card input");
const button = document.querySelector(".card button");
const results = document.querySelector(".results");

const Safe = function (s) {
  if (typeof s == "number") {
    return s;
  }
  return s.split("").join("").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

input.addEventListener("input", function (e) {
  const q = input.value.trim().replace("@", "");

  if (!q) {
    button.disabled = true;
    return;
  }
  button.disabled = false;

  if (e.key === "Enter") {
    button.click();
  }
});

button.addEventListener("click", async function () {
  const q = input.value.trim().replace("@", "").replaceAll("https://x.com/", "").replaceAll("http://x.com/", "").split("?")[0];

  if (!q) {
    return;
  }

  results.style.display = "flex";
  results.innerHTML = `<div class="loading-bar"><span></span></div><p class="loading_text">Analyzing your profile...</p>`;
  button.disabled = true;

  const result = await (
    await fetch("/api/analyse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: q,
        token: crypto.randomUUID().replaceAll("-", ""),
      }),
    })
  ).json();
  
  up();

  if (result.error) {
    button.disabled = false;
    results.innerHTML = `<p style="text-align: center">An error occurred. <b>Please try again</b> (there is a high chance this will work due to the model randomizer)</p>`;
  }

  button.disabled = false;
  results.innerHTML = `
  
  <div class="user-info">
  <img alt="profile picture" src="https://corsproxy.io/?url=${encodeURIComponent(
    result?.user?.avatar_url
  )}">
  <div class="user-info-text">
  <h2>${Safe(result?.user?.name || "Unknown")} ${
    result?.user?.verified
      ? `<svg viewBox="0 0 22 22"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path></g></svg>`
      : ""
  }</h2>
  </div>
  <div class="user-rating">
  <svg width="213" height="177" viewBox="0 0 213 177" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M100.702 25.5894C119.849 22.5217 140.223 24.2565 159.802 24.5758C173.4 29.9755 188.32 34.1988 194.824 47.8921C201.423 61.7837 193.385 79.9211 186.129 92.0145C177.396 106.569 164.924 119.778 152.071 130.662C137.571 142.94 118.011 157.006 98.7697 160.291C73.3296 164.635 48.7471 153.857 33.8744 133.158C21.779 116.324 9.00404 88.2644 19.5427 67.4573C32.5262 41.8232 75.0077 29.7062 100.702 25.5894Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M139.632 12.8041C141.357 10.6478 144.503 10.2982 146.66 12.0232C150.475 15.0752 155.277 17.3636 160.801 19.5904C162.301 19.6113 163.793 19.6232 165.275 19.6232C167.535 19.6232 169.445 21.1222 170.064 23.1801C174.23 24.8106 178.494 26.5983 182.388 28.7454C189.185 32.4936 195.489 37.6382 199.341 45.7468C203.354 54.1964 202.75 63.5576 200.501 71.9254C198.24 80.3357 194.163 88.3423 190.416 94.587C181.316 109.754 168.423 123.367 155.302 134.478C140.773 146.78 120.308 161.687 99.6112 165.22C72.1991 169.9 45.7489 158.253 29.8139 136.075C23.5266 127.325 17.0034 115.59 13.4175 103.186C9.84652 90.8345 9.01566 77.1756 15.0822 65.1981C22.3701 50.8091 37.5592 40.769 53.3551 33.8721C69.3124 26.9047 86.7935 22.7541 99.9111 20.6524C112.848 18.5796 126.404 18.6292 139.587 18.9966C138.199 17.2127 138.158 14.6468 139.632 12.8041ZM158.809 29.5594C154.502 29.4805 150.218 29.3426 145.962 29.2057C130.698 28.7146 115.794 28.2351 101.493 30.5264C88.9163 32.5415 72.3095 36.5078 57.3565 43.0366C42.2422 49.6359 29.6987 58.4714 24.0032 69.7165C19.5311 78.5461 19.8184 89.3206 23.0241 100.409C26.2148 111.445 32.1268 122.157 37.9349 130.24C51.7453 149.461 74.4601 159.37 97.9282 155.363C115.714 152.326 134.368 139.101 148.84 126.846C161.426 116.188 173.477 103.383 181.841 89.442C185.351 83.5934 188.92 76.4845 190.843 69.3298C192.778 62.1327 192.893 55.4794 190.308 50.0374C187.655 44.4528 183.247 40.639 177.559 37.5023C173.11 35.0489 168.256 33.1907 163.059 31.2009C161.666 30.6678 160.249 30.1253 158.809 29.5594Z" fill="#FF5151"/>
<path d="M165.275 14.6232C164.128 14.6232 162.973 14.616 161.81 14.6028C156.789 12.5407 152.83 10.5566 149.783 8.11887C145.471 4.66877 139.178 5.36797 135.728 9.6806C134.716 10.945 134.061 12.3783 133.75 13.8599C122.348 13.6598 110.544 13.885 99.1201 15.7153C85.732 17.8604 67.8138 22.1032 51.3543 29.2899C35.2178 36.3355 18.7059 46.9779 10.6217 62.9389C3.75733 76.4916 4.86117 91.5935 8.61419 104.575C12.3977 117.662 19.2264 129.909 25.7534 138.993C42.7502 162.648 71.0679 175.166 100.453 170.149C122.604 166.367 143.975 150.621 158.533 138.293C171.921 126.957 185.235 112.94 194.704 97.1595C198.57 90.7165 202.9 82.2611 205.329 73.2233C207.735 64.2721 208.586 53.5562 203.857 43.6016C199.406 34.2301 192.153 28.4203 184.802 24.367C181.21 22.3864 177.382 20.7195 173.706 19.2445C171.931 16.4677 168.823 14.6232 165.275 14.6232Z" stroke="white" stroke-width="10" stroke-linecap="round"/>
</svg>

  <span>${Safe(result?.result?.profile_rating?.toUpperCase() || "?")}</span>
  </div>
  </div>
  <div class="user-text">
  <p>${Safe(result?.result?.roast || "No roast available").replaceAll("[NL]", "</p><p>")}</p>
  </div>
  <div class="user-stats">
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>IQ</h4>
  <span>${result?.result?.estimated_iq}</span>
  </div>
    <div class="progress-bar"><div class="bar" style="width: ${
      (result?.result?.estimated_iq / 250) * 100
    }%"></div></div>

    </div>
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Estimated age</h4>
  <span>${result?.result?.estimated_age}</span>
  </div>
  
  <div class="progress-bar"><div class="bar" style="width: ${
    (result?.result?.estimated_age / 60) * 100
  }%"></div></div>
  </div>
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Aura points</h4>
  <span>${result?.result?.estimated_aura}</span>
  </div>
  
  
    <div class="progress-bar"><div class="bar" style="width: ${
      (result?.result?.estimated_aura / 5000) * 100
    }%"></div></div>
  </div>
  
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Gay level</h4>
  <span>${result?.result?.estimated_gay_level}%</span>
  </div>
  
  <div class="progress-bar"><div class="bar" style="width: ${
    result?.result?.estimated_gay_level
  }%"></div></div>
  </div>
  
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Brainrot level</h4>
  <span>${result?.result?.estimated_brainrot_level}%</span>
  </div>
  
  <div class="progress-bar"><div class="bar" style="width: ${
   result?.result?.estimated_brainrot_level
  }%"></div></div>
  </div>
  
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Sigma level</h4>
  <span>${result?.result?.estimated_sigma_level}%</span>
  </div>
  
  <div class="progress-bar"><div class="bar" style="width: ${
    result?.result?.estimated_sigma_level
  }%"></div></div>
  </div>
  
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Twitter addiction</h4>
  <span>${result?.result?.estimated_addiction_level}%</span>
  </div>
  
  <div class="progress-bar"><div class="bar" style="width: ${
    result?.result?.estimated_addiction_level
  }%"></div></div>
  </div>
  
  <div class="user-stat">
  <div class="user-stat-top">
  <h4>Introvert level</h4>
  <span>${result?.result?.estimated_introvert}%</span>
  </div>
  
  <div class="progress-bar"><div class="bar" style="width: ${
    result?.result?.estimated_introvert
  }%"></div></div>
  </div>
  
  <button class="share">Share</button>
  </div>
  `;

  async function shareImage(dataUrl) {
    if (!navigator.share || !navigator.canShare) {
      return;
    }

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const file = new File([blob], "image.png", { type: blob.type });

    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          text: "Get your Twitter profile analyzed & roasted by a super-smart AI! https://tweetalyzer.glitch.me/",
          files: [file],
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  }

  results.querySelector(".share").addEventListener("click", function () {
    results.querySelector(".share").disabled = true;

    const nodeWrapper = document.createElement("div");
    nodeWrapper.classList.add("nodeWrapper");

    const node = results.cloneNode(true);
    node.style.margin = "0px";
    node.querySelector(".share").remove();

    const getUrOwn = document.createElement("p");
    getUrOwn.classList.add("getown");
    getUrOwn.innerHTML = `Make your own at <u>tweetalyzer.glitch.me</u>`;

    nodeWrapper.appendChild(node);
    nodeWrapper.appendChild(getUrOwn);

    document.body.appendChild(nodeWrapper);

    document.body.overflow = "hidden";
    results.style.marginBottom = "100vh";

    try {
      htmlToImage.toPng(nodeWrapper).then(function (dataUrl) {
        results.querySelector(".share").disabled = false;
        nodeWrapper.remove();
        document.body.overflow = "auto";
        results.style.marginBottom = "40px";

        const link = document.createElement("a");
        link.setAttribute("download", "Tweetalyzer Results");
        link.setAttribute("href", dataUrl);
        link.innerHTML = `Download`;
        document.body.appendChild(link);
        setTimeout(function () {
          link.click();
        }, 1);
        setTimeout(function () {
          link.remove();
        });

        shareImage(dataUrl);
      });
    } catch (e) {
      results.querySelector(".share").disabled = false;
      nodeWrapper.remove();
      document.body.overflow = "auto";
      results.style.marginBottom = "40px";
      alert(
        `Sorry, but an error occured while trying to share your results.\n\nThis isn't a problem on our end so we can't do much about it, but meanwhile I recommend just taking a screenshot.\n\nLog:\n${e.message || e.toString()}`
      );
    }
  });
});

input.focus();

const up = async function () {
    const cc = await (await fetch("https://tweetalyzer.glitch.me/usage")).json();
    document.querySelector("#usage").innerText = `used by ${cc.count.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1 ')} ppl so far`
}

up();
setInterval(up, 5000)