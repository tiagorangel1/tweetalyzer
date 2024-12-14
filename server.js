const fetch = require("node-fetch");
const { rateLimit } = require("express-rate-limit");
const { Scraper } = require("@the-convocation/twitter-scraper");
const express = require("express");
const fs = require("fs");
const app = express();

const scraper = new Scraper();

const toks = [];

app.use(express.static("src"));
app.use(express.json());

app.get("/", async function (req, res) {
  res.sendFile(__dirname + "/src/index.html");
});

app.set("trust proxy", 4);

async function gemini(prompt) {
  const r = await (
    await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: { response_mime_type: "application/json" },
        }),
      }
    )
  ).json();

  return r.candidates[0].content.parts[0].text.trim();
}

app.post(
  "/api/analyse",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
  async function (req, res) {
    fs.appendFile(
      __dirname + "/.data/log.txt",
      `${req.body.user}\n`,
      (err) => {}
    );

    try {
      if (toks.includes(req.body.token)) {
        console.error("Duplicate token");
        res.send({
          error: true,
        });
        return;
      }

      toks.push(req.body.token);

      const [user, tweets] = await Promise.all([
        (async () => {
          return (
            await (
              await fetch(
                `https://api.twitterapi.io/twitter/user/${req.body.user}`,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.KAITO_API_KEY}`,
                  },
                }
              )
            ).json()
          ).data;
        })(),
        (async () => {
          return (
            await (
              await fetch(
                `https://api.twitterapi.io/twitter/user/${req.body.user}/tweets`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${process.env.KAITO_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    cursor: "",
                  }),
                }
              )
            ).json()
          ).tweets.map((tw) => {
            return {
              text: tw.text,
              likes: tw.likeCount,
              replies: tw.replyCount,
              retweets: tw.retweetCount,
              timestamp: tw.createdAt,
              views: tw.viewCount,
            };
          });
        })(),
      ]);

      const resp =
        await gemini(`Analyze the following Twitter/X user and reply in the following format:
  {
    estimated_iq: Number,
    estimated_age: Number,
    estimated_aura: Number,
    estimated_gay_level: Number,
    estimated_introvert: Number,
    estimated_addiction_level: Number,
    estimated_brainrot_level: Number,
    estimated_sigma_level: Number,
    profile_rating: "<S, A, B, C, D or F>",
    roast: "<deliver a very harsh, ~600 character roast of the user. do not have problems critiquing anything and roast them as much as possible. don't spare them. use [NL] for line breaks, but only use it like 3 times>"
  }
  
  Roast tips:
  * verified means that the user paid for a blue checkmark
  * Also check their follower ratio
  * If the person has a lot of tweets but not much followers, roast that
  
  * a high estimated_aura would be around 5000
  * estimated_introvert is the estimated % that the person is an introvert
  * estimated_sigma_level is the estimated % that the person is sigma, aka cool, badass
  * estimated_introvert, estimated_addiction_level, estimated_sigma_level and estimated_brainrot_level, estimated_gay_level are out of 100%
  
  User: ${JSON.stringify(user)}  
  User's latest tweets: ${JSON.stringify(tweets)}
  
  Your reply should ONLY consist of properly formatted JSON. Do NOT wrap it in a code block.
`);

      res.json({ result: JSON.parse(resp), user, tweets });
    } catch (e) {
      console.error(e);
      res.json({
        error: true,
      });
      return;
    }
  }
);

app.get("/pfp_proxy", 
  rateLimit({
    windowMs: 1000,
    limit: 2,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }), async (req, res) => {
  const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];

  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send("URL query parameter is required.");
  }

  try {
    const response = await fetch(imageUrl);
    const contentType = response.headers.get("content-type");

    if (!allowedImageTypes.includes(contentType)) {
      return res.status(400).send("Unsupported image type.");
    }

    res.setHeader("Content-Type", contentType);
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send("Error fetching the image.");
  }
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
