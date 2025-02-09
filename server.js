const { slowDown } = require('express-slow-down')
const express = require("express");
const { gunzip, gzip } = require("zlib");
const Cap = require('@cap.js/server');
const crypto = require("crypto");
const fs = require("fs");
const cors = require("cors");
const app = express();

require('dotenv').config();

app.set("trust proxy", 4);

app.use(
  cors({
    origin: "https://twt.tiagorangel.com",
    credentials: true,
  })
);

const cap = new Cap({
  tokens_store_path: '.data/tokensList.json'
});

let usage = JSON.parse(fs.readFileSync("./.data/usage.json", "utf-8"));

app.use(express.json());

const limiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  delayMs: (hits) => hits * 200,
})

app.use("/api/analyze", limiter);

app.use("*", function (req, res, next) {
  const headers = req.headers;

  if (headers.host !== process.env.CF_HOST_TOKEN) {
    return res.status(403).send("Forbidden");
  }

  next();
})

setTimeout(async function () {
  usage = JSON.parse(fs.readFileSync("./.data/usage.json", "utf-8"));
}, 2000);

app.use(express.static("src"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/src/index.html");
});

app.post("/api/analyze", async function (req, res) {
  const user = req.body.user;
  const token = req.body.token;
  const capRes = await cap.validateToken(token);

  if (!capRes.success) {
    console.error(`[${user} ${token}] Invalid cap token`)
    return res.json({
      invalidUser: true,
    });
  }

  usage.count++;
  fs.writeFile("./.data/usage.json", JSON.stringify(usage), function () { });

  if (!user.trim()) {
    console.error(`[${user} ${token}] user not provided`)
    return res.json({
      invalidUser: true,
    });
  }

  const tweetsResponse = await (
    await fetch(
      `https://api.twitterapi.io/twitter/user/last_tweets?userName=${encodeURIComponent(
        user
      )}`,
      { method: "GET", headers: { "X-API-Key": process.env.KAITO_API_KEY } }
    )
  ).json();

  if (tweetsResponse.status !== "success") {
    console.error(`[${user} ${token}] twitterapi error`, JSON.stringify(tweetsResponse))
    return res.json({
      invalidUser: true,
    });
  }

  const formatTweet = function (tweet, pinned) {
    if (!tweet) {
      return null;
    }
    return {
      pinned,
      text: tweet?.text,
      retweets: tweet?.retweetCount,
      likes: tweet?.likeCount,
      replies: tweet?.replyCount,
      views: tweet?.viewCount,
      date: tweet?.createdAt,
      author: {
        username: tweet?.author?.userName,
        name: tweet?.author?.name,
        twitterBlue: tweet?.author?.isBlueVerified,
        pfp: tweet?.author?.profilePicture,
        cover: tweet?.author?.coverPicture,
        bio: tweet?.author?.profile_bio?.description,
        location: tweet?.author?.location,
        followers: tweet?.author?.followers,
        following: tweet?.author?.following,
        created: tweet?.author?.createdAt,
        likes: tweet?.author?.favouritesCount,
        tweets: tweet?.author?.statusesCount,
      },
    };
  };

  const tweets = [
    ...[formatTweet(tweetsResponse.data.pin_tweet) || []],
    ...tweetsResponse.data.tweets?.map(formatTweet, false),
  ].filter(Boolean);

  const userData = tweets.find((tweet) => {
    return !!tweet?.author;
  })?.author;

  if (!userData) {
    return res.json({
      invalidUser: true,
    });
  }

  const id = crypto.randomUUID().split("-")[1];

  const llm = await (
    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "developer",
            content:
              "You are an expert Twitter account analyzer. Make sure to reply ONLY in plain JSON **NOT** inside of a code block",
          },
          {
            role: "user",
            content: `Analyze the following Twitter/X user and reply in the format defined in your schema

Accuracy is always from 0 to 100.
Reason is usually around 100 characters.
predictions_next_year can include, for example, money, followers, etc. Usually there should be 4 predictions
time_spent and interests: there should usually be 5 of these.
A high estimated_aura would be around 5000
Twitter twin note: Avoid using popular people like Elon Musk

Note: Only the roast should be aggressive. The rest should be friendly and not intended to directly offend the user.

User: ${JSON.stringify(userData)}  
User's latest tweets: ${JSON.stringify(
              tweets.map((tweet) => {
                delete tweet?.author;
                return tweet;
              })
            )}
  
Roast notes: Also insult the user personally. Make sure to always base it on their Twitter.
follower_estimation note: Estimated followers in a year

VERY IMPORTANT: The rest of the analysis is NOT to make fun of the user. Be friendly and serious there. Only make fun of the user in the designated roast.

Your reply should ONLY consist of properly formatted JSON. Do NOT wrap it in a code block. Your output JSON should be minified. MAKE SURE IT'S PROPERLY FORMATTED JSON WITH NOTHING AROUND IT.
`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "results_schema",
            schema: {
              type: "object",
              properties: {
                roast: {
                  type: "string",
                  description:
                    "A relentless, ~500-character roast of the user, sparing no aspect of their personality, habits, or content. Incorporate sarcasm, brutal honesty, and specific critiques, even mocking their achievements, interests, or lack thereof. Do not shy away from savage wit or personal jabs.",
                },
                analysis: {
                  type: "object",
                  properties: {
                    iq: {
                      type: "object",
                      properties: {
                        estimation: { type: "number" },
                        accuracy: { type: "number" },
                      },
                      required: ["estimation", "accuracy"],
                    },
                    aura: {
                      type: "object",
                      properties: {
                        estimation: { type: "number" },
                        accuracy: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["estimation", "accuracy", "description"],
                    },
                    energy: {
                      type: "object",
                      properties: {
                        vibe: { type: "string" },
                        level: { type: "number" },
                      },
                      required: ["vibe", "level"],
                    },
                    vibe: {
                      type: "object",
                      properties: {
                        dominant: { type: "string" },
                        secondary: { type: "string" },
                        accuracy: { type: "number" },
                      },
                      required: ["dominant", "secondary", "accuracy"],
                    },
                  },
                  required: ["iq", "aura", "energy", "vibe"],
                },
                comparisons: {
                  type: "object",
                  properties: {
                    billionaire: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        reason: { type: "string" },
                        accuracy: { type: "number" },
                      },
                      required: ["name", "reason", "accuracy"],
                    },
                    villain: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        reason: { type: "string" },
                        accuracy: { type: "number" },
                      },
                      required: ["name", "reason", "accuracy"],
                    },
                    fictional_character: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        reason: { type: "string" },
                        accuracy: { type: "number" },
                      },
                      required: ["name", "reason", "accuracy"],
                    },
                    twitter_twin: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        reason: { type: "string" },
                        accuracy: { type: "number" },
                      },
                      required: ["name", "reason", "accuracy"],
                    },
                  },
                  required: [
                    "billionaire",
                    "villain",
                    "fictional_character",
                    "twitter_twin",
                  ],
                },
                life_insights: {
                  type: "object",
                  properties: {
                    age: {
                      type: "object",
                      properties: {
                        estimation: { type: "number" },
                        accuracy: { type: "number" },
                        reason: { type: "string" },
                      },
                      required: ["estimation", "accuracy", "reason"],
                    },
                    follower_estimation: { type: "number" },
                    best_quote: { type: "string" },
                    predictions_next_year: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          emoji: { type: "string" },
                          title: { type: "string" },
                          description: { type: "string" },
                          accuracy: { type: "number" },
                        },
                        required: ["emoji", "title", "description", "accuracy"],
                      },
                    },
                    estimated_death_year: { type: "number" },
                    what_made_viral: { type: "string" },
                    biggest_failure: { type: "string" },
                  },
                  required: [
                    "age",
                    "follower_estimation",
                    "best_quote",
                    "predictions_next_year",
                    "estimated_death_year",
                    "what_made_viral",
                    "biggest_failure",
                  ],
                },
                personality: {
                  type: "object",
                  properties: {
                    time_spent: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          percentage: { type: "number" },
                          description: { type: "string" },
                        },
                        required: ["name", "percentage", "description"],
                      },
                    },
                    interests: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          emoji: { type: "string" },
                          intensity: { type: "number" },
                        },
                        required: ["name", "emoji", "intensity"],
                      },
                    },
                    traits: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          positive: { type: "boolean" },
                          description: { type: "string" },
                        },
                        required: ["name", "positive", "description"],
                      },
                    },
                  },
                  required: ["time_spent", "interests", "traits"],
                },
                moreyou: {
                  type: "object",
                  properties: {
                    dream_job: { type: "string" },
                    secret_talent: { type: "string" },
                    weirdest_fact: { type: "string" },
                    current_arc: { type: "string" },
                  },
                  required: [
                    "dream_job",
                    "secret_talent",
                    "weirdest_fact",
                    "current_arc",
                  ],
                },
              },
              required: [
                "roast",
                "analysis",
                "comparisons",
                "life_insights",
                "personality",
                "moreyou",
              ],
            },
          },
        },
      }),
    })
  ).json();

  if (!llm.choices[0]?.message) {
    console.error(`[${user} ${token}] message missing`, JSON.stringify(llm))
  }

  gzip(
    JSON.stringify({
      user: userData,
      llm: JSON.parse(llm.choices[0].message.content),
    }),
    (_, result) => {
      fs.writeFileSync(`./.data/results/${id}.json`, result);

      res.json({
        invalidUser: false,
        ok: true,
        id,
      });
    }
  );
});

const generateTemplate = async function (req, res) {
  try {
    const id = req.params.id;

    if (["a94f"].includes(id)) {
      return res.status(403).send("This result has been removed due to violation of ToS.");
    }
    const data = await fs.promises.readFile(`./.data/results/${id}.json`);
    const unzipped = await new Promise((resolve, reject) =>
      gunzip(data, (err, result) => (err ? reject(err) : resolve(result)))
    );

    try {
      fetch(`https://abacus.jasoncameron.dev/hit/${process.env.ABACUS_KEY || "tweetalyzer2"}/${id}`)
    } catch { }

    const templatefile = await fs.promises.readFile(
      "./src/view/index.html",
      "utf-8"
    );

    res.set("Content-Type", "text/html");
    res.send(
      templatefile
        .toString()
        .replace("%%json%%", encodeURIComponent(JSON.stringify(JSON.parse(unzipped.toString()))))
        .replace("%%username%%", JSON.parse(unzipped.toString()).user?.username?.split('<')?.join('')?.split('>')?.join(''))
        .replace("%%name%%", JSON.parse(unzipped.toString()).user?.name?.split('<')?.join('')?.split('>')?.join(''))
    );
  } catch { res.redirect("/") }
};

app.get("/api/usage", function (req, res) {
  res.json(usage);
});

app.get("/api/pfps", function (req, res) {
  const data = fs.readFileSync("./.data/pfps.txt", "utf-8");

  const lines = data.split("\n").filter((line) => line.trim() !== "");

  const shuffled = lines.sort(() => 0.5 - Math.random());
  res.json({ pfps: shuffled.slice(0, 3) });
});

app.get("/api/auraboard", (req, res) => {
  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
      { label: "second", seconds: 1 }
    ];

    for (const { label, seconds: s } of intervals) {
      const count = Math.floor(seconds / s);
      if (count >= 1) {
        return `${count} ${label}${count > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  }

  const file = fs.readFileSync("./.data/auraboard.txt", "utf-8").split("\n").filter((line) => line.trim() !== "");

  const transform = function (u, rank) {
return {
  aura: u[0], username: u[1], pfp: u[2], link: "/" + u[3], rank
}
  }
  res.json({
    ok: true,
    updated: timeAgo(file[0]),
    top: file.slice(1).slice(0, 20).map((u, i) => transform(JSON.parse(`[${u}]`), i + 1))
  })
})

app.post("/api/challenge", (req, res) => {
  res.json(cap.createChallenge({
    challengeCount: 64,
    challengeSize: 64,
    challengeDifficulty: 3
  }));
});

app.post("/api/redeem", async (req, res) => {
  const { token, solutions } = req.body;
  if (!token || !solutions) {
    return res.status(400).json({ success: false });
  }
  res.json(await cap.redeemChallenge({ token, solutions }));
});

app.get("/api/internal/auraboard", function (req, res) {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ success: false });
  }
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(400).json({ success: false });
  }

  delete require.cache[require.resolve("./scripts/auraboard.js")];
  require("./scripts/auraboard.js");

  res.json({
    ok: true
  })
})

app.get("/results/:id", generateTemplate);
app.get("/:id", generateTemplate);

const listener = app.listen(process.env.PORT || 5551, function () {
  console.log("Your app is listening on port " + listener.address().port);
});