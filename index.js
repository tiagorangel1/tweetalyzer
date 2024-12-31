const { rateLimit } = require("express-rate-limit");
const express = require("express");
const fs = require("fs");
const app = express();

const toks = [];
let count = 0;

app.use(express.json());

app.get("/", async function (req, res) {
  if (process.env.IS_DOWN === "yes") {
    res.send(
      `Hey everyone, Tweetalyzer is temporarily down. CPU usage spiked, and I've hit my Cloudflare Workers limit. Please don't DM me about it — I will lift this soon`
    );
    return;
  }
  res.sendFile(__dirname + "/src/index.html");
});

app.use(express.static("src"));

app.set("trust proxy", 4);

async function promptModel(prompt) {
  const providers = process.env.PROVIDERS.split(",");
  const provider = providers[Math.floor(Math.random() * providers.length)];

  if (provider === "openai") {
    const llmRes = await (
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
              role: "user",
              content: prompt,
            },
          ],
        }),
      })
    ).json();

    return llmRes.choices[0].message.content;
  }
  if (provider === "google") {
    const llmRes = await (
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          "I was unable to ask Google for an AI response. Please try again up to 5 times, it will almost 100% work.",
      });
    }

    return llmRes.candidates[0].content.parts[0].text.trim();
  }
  if (provider === "xai") {
    return (
      await (
        await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            model: process.env.XAI_MODEL,
            stream: false,
            temperature: 0,
          }),
        })
      ).json()
    ).choices[0].message.content;
  }
  if (provider === "groq") {
    return (
      await (
        await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.GROQ_API_KEY,
          },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          }),
        })
      ).json()
    ).choices[0].message.content;
  }
}

app.post(
  "/api/analyse",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
  async function (req, res) {
    if (process.env.IS_DOWN === "yes") {
      res.send(
        `Hey everyone, Tweetalyzer is temporarily down. Please don't DM me about it — I will lift this soon`
      );
      return;
    }

    fs.appendFile(
      __dirname + "/.data/log.txt",
      `${req.body.user}\n`,
      (err) => {}
    );

    if (req.body.user === "tiagorangel23") {
      res.json({
        result: {
          estimated_iq: 500,
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

    if (req.body.user === "Fynjirby") {
      res.json({
        result: {
          estimated_iq: 300,
          estimated_age: 23,
          estimated_aura: 9999999,
          estimated_gay_level: 0,
          estimated_introvert: 60,
          estimated_addiction_level: 0,
          estimated_brainrot_level: 0,
          estimated_sigma_level: 100,
          profile_rating: "S+",
          roast:
            "u are the best on the earth, u can do everything what u like to do! Your 63 followers is the best peoples on earth… #totallynotrigged",
        },
        user: {
          id: "1547179407734980608",
          name: "Egor",
          screen_name: "Fynjirby",
          location: "Russia",
          url: "https://t.co/aojRtxwfks",
          description: "Little yapper 🎉 mail - egor@fynjirby.space",
          protected: false,
          verified: true,
          followers_count: 63,
          following_count: 76,
          friends_count: 76,
          favourites_count: 7045,
          statuses_count: 1368,
          media_tweets_count: 164,
          created_at: "2022-07-13T11:21:57.000000Z",
          banner_url:
            "https://pbs.twimg.com/profile_banners/1547179407734980608/1734347278",
          avatar_url:
            "https://pbs.twimg.com/profile_images/1868897668417613824/8aiEXm0j_normal.jpg",
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

      console.log([user, tweets]);

      const plainResp =
        await promptModel(`Analyze the following Twitter/X user and reply in the following format:
  {
    "roast": "<deliver a very harsh, ~600 character roast of the user. do not have problems critiquing anything and roast them as much as possible. don't spare them. insult them as much as possible. use [NL] for line breaks, but only use it about 3 times>",
    "estimated_iq": Number,
    "estimated_age": Number,
    "estimated_aura": Number,
    "estimated_gay_level": Number,
    "estimated_introvert": Number,
    "estimated_addiction_level": Number,
    "estimated_brainrot_level": Number,
    "estimated_sigma_level": Number,
    "profile_rating": "<S, A, B, C, D or F>"
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
  
  Your reply should ONLY consist of properly formatted JSON. Do NOT wrap it in a code block. Your output JSON should be minified. MAKE SURE IT'S PROPERLY FORMATTED JSON WITH NOTHING AROUND IT.
`);

      const resp = JSON.parse(plainResp);

      // https://x.com/Fynjirby/status/1871540633439183152
      if (req.body.user === "Fynjirby") {
        resp.estimated_introvert = 100;
      }

      if (req.body.user === "veryhappyrn") {
        resp.estimated_gay_level = 200;
      }

      if (req.body.user === "new92account") {
        resp.estimated_iq = 92;
        resp.estimated_age = 483;
        resp.estimated_aura = 92;
        resp.estimated_gay_level = 92;
        resp.estimated_introvert = 92;
        resp.estimated_addiction_level = 92;
        resp.estimated_brainrot_level = 92;
        resp.estimated_sigma_level = 92;
      }

      // https://x.com/ItsTatsugiri/status/1872583449015656935
      if (req.body.user === "ItsTatsugiri") {
        resp.estimated_aura = 777;
      }
      
      // https://x.com/ItsTatsugiri/status/1873810375713624269
      
      if (req.body.user === "The7NumberSeven") {
        resp.estimated_iq = 7;
        resp.estimated_age = 7;
        resp.estimated_aura = 7;
        resp.estimated_gay_level = 7;
        resp.estimated_introvert = 7;
        resp.estimated_addiction_level = 7;
        resp.estimated_brainrot_level = 7;
        resp.estimated_sigma_level = 7;
      }
      
            if (req.body.user === "Negative7Number") {
        resp.estimated_iq = -7;
        resp.estimated_age = -7;
        resp.estimated_aura = -7;
        resp.estimated_gay_level = -7;
        resp.estimated_introvert = -7;
        resp.estimated_addiction_level = -7;
        resp.estimated_brainrot_level = -7;
        resp.estimated_sigma_level = -7;
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

app.get("/admin", function (req, res) {
  if (req.query.key === process.env.ADMIN_KEY) {
    fs.readFile(".data/log.txt", "utf-8", (_, f) => {
      res.json([...new Set(f.split("\n"))]);
    });
    return;
  }
  res.send("nope");
});

app.get("/usage", (req, res) => {
  res.json({ count });
});

setInterval(function () {
  fs.readFile(".data/log.txt", "utf-8", (_, f) => {
    count = new Set(f.split("\n").filter(Boolean)).size;
  });
}, 4000);

fs.readFile(".data/log.txt", "utf-8", (_, f) => {
  count = new Set(f.split("\n").filter(Boolean)).size;
});

const listener = app.listen(process.env.PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
