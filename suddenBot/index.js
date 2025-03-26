const {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");
const { token, suddenToken } = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
});

async function fetchSuddenAttackStats(suddenName, gameMode) {
  try {
    const urlString = `https://open.api.nexon.com/suddenattack/v1/id?user_name=${encodeURIComponent(
      suddenName
    )}`;

    const response = await fetch(urlString, {
      headers: { "x-nxopen-api-key": suddenToken },
    });
    const data = await response.json();

    if (!data || !data.ouid) {
      return `❌ OUID를 찾을 수 없습니다. (닉네임: ${suddenName})`;
    }

    const ouid = data.ouid;
    console.log(`✅ ${suddenName}의 OUID:`, ouid);
    console.log(`✅ ${suddenName}의 Mode:`, gameMode);

    // 여러 API 호출 (basic, rank, recent-info, match, tier)
    const endpoints = [
      {
        name: "기본 정보",
        key: "basic",
        url: `https://open.api.nexon.com/suddenattack/v1/user/basic?ouid=${ouid}`,
      },
      {
        name: "랭크 정보",
        key: "rank",
        url: `https://open.api.nexon.com/suddenattack/v1/user/rank?ouid=${ouid}`,
      },
      {
        name: "최근 전적",
        key: "recent",
        url: `https://open.api.nexon.com/suddenattack/v1/user/recent-info?ouid=${ouid}`,
      },
      {
        name: "매치 정보",
        key: "match",
        url: `https://open.api.nexon.com/suddenattack/v1/match?ouid=${ouid}&match_mode=${encodeURIComponent(
          gameMode
        )}`,
      },
      {
        name: "티어 정보",
        key: "tier",
        url: `https://open.api.nexon.com/suddenattack/v1/user/tier?ouid=${ouid}`,
      },
    ];

    let results = {};

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint.url, {
          headers: { "x-nxopen-api-key": suddenToken },
        });
        results[endpoint.key] = await res.json();
      } catch (error) {
        console.error(`❌ ${endpoint.name} 불러오기 실패:`, error);
        results[endpoint.key] = null;
      }
    }

    // 데이터 가공
    const basic = results.basic || {};
    const rank = results.rank || {};
    const recent = results.recent || {};
    const tier = results.tier || {};
    const match =
      results.match && results.match.match && results.match.match.length > 0
        ? results.match.match
        : null;

    const embed = new EmbedBuilder()
      .setColor("#ff6600")
      .setTitle(`⚡ **${suddenName}의 전적 정보** ⚡`)
      .setThumbnail("https://example.com/avatar.png")
      .setDescription(
        `클랜: ${basic.clan_name || "N/A"}\n\n` +
          `솔랭티어: ${
            tier.solo_rank_match_tier === "UNRANK"
              ? "배치전"
              : tier.solo_rank_match_score && tier.solo_rank_match_score !== 0
              ? tier.solo_rank_match_score + "점"
              : "배치전"
          }\n\n` +
          `파랭티어: ${
            tier.party_rank_match_tier === "UNRANK"
              ? "배치전"
              : tier.party_rank_match_score && tier.party_rank_match_score !== 0
              ? tier.party_rank_match_score + "점"
              : "배치전"
          }\n\n` +
          `시즌계급: ${rank.season_grade || "N/A"}\n\n` +
          `시즌계급랭킹: ${
            rank.season_grade_ranking ? rank.season_grade_ranking + "위" : "N/A"
          }\n\n` +
          `매너등급: ${basic.manner_grade || "N/A"}\n\n`
      )

      .addFields({
        name: "🕹 **최근 동향**",
        value:
          `최근 승률: ${recent.recent_win_rate || "0"}%\n` +
          `최근 킬데스: ${
            recent.recent_kill_death_rate
              ? recent.recent_kill_death_rate.toFixed(1) + "%"
              : "N/A"
          }\n` +
          `최근 돌격소총 킬데스: ${
            recent.recent_assault_rate
              ? recent.recent_assault_rate.toFixed(1) + "%"
              : "N/A"
          }\n` +
          `최근 저격소총 킬데스: ${
            recent.recent_sniper_rate
              ? recent.recent_sniper_rate.toFixed(1) + "%"
              : "N/A"
          }\n` +
          `최근 특수총 킬데스: ${
            recent.recent_special_rate
              ? recent.recent_special_rate.toFixed(1) + "%"
              : "N/A"
          }%`,
        inline: true,
      })
      .setFooter({
        text: "Sudden Attack Stats 🔥",
      })
      .setTimestamp();

    return { embeds: [embed] };
  } catch (error) {
    console.error("❌ API 요청 중 오류 발생:", error);
    return { content: "⚠️ 전적 조회 중 오류가 발생했습니다." };
  }
}

// 디스코드 봇 명령어 감지
client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // 봇이 보낸 메시지는 무시

  if (message.content.startsWith("!전적 ")) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      return message.reply("⚠️ 사용법: `!전적 닉네임 [게임모드]`");
    }

    const suddenName = args[1]; // 닉네임
    const gameMode = args[2] || "폭파미션"; // 기본값: 폭파미션
    message.reply(`⏳ **${suddenName}**의 전적을 조회하는 중...`);

    const result = await fetchSuddenAttackStats(suddenName, gameMode);

    message.reply(result);
  }
});

client.login(token);
