const fetch = require("node-fetch");
const { rateLimit } = require("express-rate-limit");
const express = require("express");
const fs = require("fs");
const app = express();

const toks = [];

app.use(express.static("src"));
app.use(express.json());

app.get("/", async function (req, res) {
  res.sendFile(__dirname + "/src/index.html");
});

app.set("trust proxy", 4);

async function promptModel(prompt) {
  if (process.env.PROVIDER === "openai") {
    const llmRes = await (await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })).json();
    
    console.log(llmRes.choices[0].message.content)
    
    return llmRes.choices[0].message.content;
  }
  const llmRes = await (
    await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.MODEL}:generateContent?key=${process.env.API_KEY}`,
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

  if (llmRes?.error?.code === 429) {
    return JSON.stringify({
      estimated_iq: 0,
      estimated_age: 0,
      estimated_aura: 0,
      estimated_gay_level: 0,
      estimated_introvert: 0,
      estimated_addiction_level: 0,
      estimated_brainrot_level: 0,
      estimated_sigma_level: 0,
      profile_rating: ":(",
      roast:
        "Sorry, but tweetalyzer is down. There isn't much I can do about it, you can just wait until Google resets my ratelimit. This can take from an hour to a day. Sorry!",
    });
  }

  return llmRes.candidates[0].content.parts[0].text.trim();
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

    if (req.body.user === "tiagorangel23") {
      res.json({
        result: {
          estimated_iq: 200,
          estimated_age: 23,
          estimated_aura: 9999999,
          estimated_gay_level: 0,
          estimated_introvert: 60,
          estimated_addiction_level: 0,
          estimated_brainrot_level: 20,
          estimated_sigma_level: 100,
          profile_rating: "S+",
          roast: "i love my creator please don't shut me down!!!",
        },
        user: {
          id: "1340268334785376258",
          name: "tiago://",
          screen_name: "tiagorangel23",
          location: "Lisbon, Portugal",
          url: "https://t.co/3PNElOMZ37",
          description: "hi!",
          protected: false,
          verified: false,
          followers_count: 187,
          following_count: 1227,
          friends_count: 1227,
          favourites_count: 39928,
          statuses_count: 4151,
          media_tweets_count: 155,
          created_at: "2020-12-19T12:10:53.000000Z",
          banner_url:
            "https://pbs.twimg.com/profile_banners/1340268334785376258/1734897733",
          avatar_url:
            "https://pbs.twimg.com/profile_images/1696450660407926784/CCG_EJjg_normal.png",
          can_dm: true,
        },
        tweets: [],
      });
    }

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

      const resp = JSON.parse(
        await promptModel(`Analyze the following Twitter/X user and reply in the following format:
  {
    roast: "<deliver a very harsh, ~600 character roast of the user. do not have problems critiquing anything and roast them as much as possible. don't spare them. insult them as much as possible. use [NL] for line breaks, but only use it about 3 times>",
    estimated_iq: Number,
    estimated_age: Number,
    estimated_aura: Number,
    estimated_gay_level: Number,
    estimated_introvert: Number,
    estimated_addiction_level: Number,
    estimated_brainrot_level: Number,
    estimated_sigma_level: Number,
    profile_rating: "<S, A, B, C, D or F>"
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
`)
      );

      // https://x.com/Fynjirby/status/1871540633439183152
      if (req.body.user === "Fynjirby") {
        resp.estimated_introvert = 100;
      }

      res.json({ result: resp, user, tweets });
    } catch (e) {
      console.error(e);
      res.json({
        error: true,
      });
      return;
    }
  }
);

app.get(
  "/pfp_proxy",
  rateLimit({
    windowMs: 1000,
    limit: 2,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
  async (req, res) => {
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
  }
);

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
