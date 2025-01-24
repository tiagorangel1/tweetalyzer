/* global Chart */

function formatNumber(num) {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'k';
  } else {
    return num.toString();
  }
}

const results = window.RESULTS_DATA;

document.querySelector(".following-count").innerText = formatNumber(results.user.following)
document.querySelector(".followers-count").innerText = formatNumber(results.user.followers)
document.querySelector(".followers-in-a-year").innerText = formatNumber(results.llm.life_insights.follower_estimation)

document.querySelectorAll("[data-contents]").forEach((el) => {
  const path = el.getAttribute("data-contents").split(".");
  const value = path.reduce((acc, key) => acc && acc[key], results);
  el[el.getAttribute("data-set")] = value;
});

const Safe = function (input) {
  if (typeof input === "number") {
    return input;
  }
  if (typeof input === "string") {
    return input.split("").join("").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  if (Array.isArray(input)) {
    return input.map(Safe);
  }
  if (typeof input === "object" && input !== null) {
    let safeObj = {};
    for (let key in input) {
      if (input.hasOwnProperty(key)) {
        safeObj[Safe(key)] = Safe(input[key]);
      }
    }
    return safeObj;
  }

  if (!input) {
    return input;
  }
  throw new Error("Unrecognized type");
};

results.llm.life_insights.predictions_next_year.forEach((prediction) => {
  const element = document.createElement("div");
  element.innerHTML = `<div class="header">
   <p class="emoji">${Safe(prediction.emoji)}</p>
            <h2>${Safe(prediction.title)}</h2>
            <p>${Safe(prediction.description)}</p>
            </div>
          <p class="accuracy">
             <span>${Safe(prediction.accuracy)}</span>% accuracy
          </p>`;

  document.querySelector(".analysis-predictions").appendChild(element);
});

results.llm.personality.interests.forEach((prediction) => {
  const element = document.createElement("div");

  element.innerHTML = `<div class="header">
   <p class="emoji">${Safe(prediction.emoji)}</p>
            <h2>${Safe(prediction.name)}</h2>
            <p><b>${Safe(prediction.intensity)}%</b> intensity</p>
            </div>`;

  document.querySelector(".personality-interests").appendChild(element);
});

results.llm.personality.traits.forEach((prediction) => {
  const element = document.createElement("div");
  element.innerHTML = `<div class="header">
   <p class="emoji">${prediction.positive ? "➕" : "➖"}</p>
            <h2>${Safe(prediction.name)}</h2>
            <p>${Safe(prediction.description)}</p>
            </div>`;

  document.querySelector(".personality-traits").appendChild(element);
});

new Chart("timeSpent", {
  type: "pie",
  data: {
    labels: results.llm.personality.time_spent.map((e) => {
      return e.name;
    }),
    datasets: [
      {
        backgroundColor: [
          "#3D72EE",
          "#45CC70",
          "#FB8236",
          "#DE5AF1",
          "#E62E08",
          "#FFC947",
          "#20B2AA",
          "#FF6347",
          "#9370DB",
          "#FF69B4",
          "#FFD700",
          "#48D1CC",
          "#FF4500",
          "#6A5ACD",
          "#FF1493",
        ],
        data: results.llm.personality.time_spent.map((e) => {
          return e.percentage;
        }),
      },
    ],
  },
  options: {},
});

if (location.pathname.includes("results")) {
  document.querySelectorAll("[share-only]").forEach((e) => {
    e.style.display = "none";
  });
} else {
  document.querySelectorAll("[results-only]").forEach((e) => {
    e.style.display = "none";
  });
}

document.querySelector(".share input").value = 
  `twt.tiagorangel.com/${location.pathname.replace("/results", "").replace("/share", "").replaceAll("/", "")}`

document.querySelectorAll(".share-on-twitter, .share button").forEach((e) => {
  e.addEventListener("click", function () {
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(`Here are my Tweetalyzer results!

https://twt.tiagorangel.com/${location.pathname.replace("/results", "").replace("/share", "").replaceAll("/", "")}

https://x.com/tiagorangel23/status/1881067846970814522`)}`, "_blank")
  })
})

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const delay = index * 100;
        setTimeout(() => {
          entry.target.style.transition = 'opacity 0.8s, transform 0.8s';
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';
    observer.observe(card);
  });
});
