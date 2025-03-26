const {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  SlashCommandBuilder,
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

client.on(Events.ClientReady, async () => {
  await client.application.commands.create(
    new SlashCommandBuilder()
      .setName("전적")
      .setDescription("Sudden Attack 전적을 조회합니다.")
      .addStringOption((option) =>
        option
          .setName("닉네임")
          .setDescription("조회할 닉네임을 입력하세요.")
          .setRequired(true)
      )
      .addStringOption(
        (option) =>
          option
            .setName("게임모드")
            .setDescription("게임 모드를 선택하세요.")
            .setRequired(false) // 선택사항으로 설정
      )
  );
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

    //프로그래스바
    function generateProgressBar(value) {
      if (value === undefined || value === null) return "-".repeat(10); // handle null or undefined values
      const percent = Math.min(100, Math.max(0, value)); // ensure percentage is between 0 and 100
      const barLength = 10;
      const filledLength = Math.round((barLength * percent) / 100);
      return "█".repeat(filledLength) + "-".repeat(barLength - filledLength);
    }

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
          `최근 승률: [${generateProgressBar(recent.recent_win_rate)}] ${
            recent.recent_win_rate || "0"
          }%\n` +
          `최근 킬데스: [${generateProgressBar(
            recent.recent_kill_death_rate
          )}] ${
            recent.recent_kill_death_rate
              ? recent.recent_kill_death_rate.toFixed(1) + "%"
              : "N/A"
          }\n` +
          `최근 돌격소총 킬데스: [${generateProgressBar(
            recent.recent_assault_rate
          )}] ${
            recent.recent_assault_rate
              ? recent.recent_assault_rate.toFixed(1) + "%"
              : "N/A"
          }\n` +
          `최근 저격소총 킬데스: [${generateProgressBar(
            recent.recent_sniper_rate
          )}] ${
            recent.recent_sniper_rate
              ? recent.recent_sniper_rate.toFixed(1) + "%"
              : "N/A"
          }\n` +
          `최근 특수총 킬데스: [${generateProgressBar(
            recent.recent_special_rate
          )}] ${
            recent.recent_special_rate
              ? recent.recent_special_rate.toFixed(1) + "%"
              : "N/A"
          }`,
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
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "전적") {
    const nickname = interaction.options.getString("닉네임");
    const gameMode = interaction.options.getString("게임모드") || "폭파미션"; // 기본값은 폭파미션

    await interaction.reply(`⏳ **${nickname}**의 전적을 조회하는 중...`);

    const result = await fetchSuddenAttackStats(nickname, gameMode);

    await interaction.editReply(result); // 결과를 수정하여 응답
  }
});

client.login(token);
