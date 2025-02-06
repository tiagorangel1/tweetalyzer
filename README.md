<div align="center">

<img src="https://assets-store.glitch.me/twtlyzer.svg" width="50">    

**Tweetalyzer 2**  
Your Twitter analyzed, cooked & roasted by AI

</div>

***

## How to self-host Tweetalyzer
**Requirements:** Bun and Git

1. Clone the repo
2. Rename `.env.example` to `.env` and set the API keys and configuration
3. `bun install`
4. `bun run start`
5. Server should be running at `localhost:3000`


### Important: `host` header
Tweetalyzer requires a `host` header with the contents of `env.CF_HOST_TOKEN` by default — this is to prevent attackers with access to your device's IP from bypassing Cloudflare's firewall and DDOS mitigation services.

If you're on Cloudflare Tunnels, you can set the `host` header to the contents of `env.CF_HOST_TOKEN`, else you can just remove the part of the code that checks this.

### Setting up the auraboard

The auraboard is set up by default to update when a `GET` request to `/api/internal/auraboard` with a `token` query parameter corresponding to `process.env.ADMIN_TOKEN` is made.

This is so that you can set up external cron jobs to run it whenever you want.