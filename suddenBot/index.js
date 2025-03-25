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

    // 여러 API 호출 (basic, rank, recent-info, match)
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

    console.log("result => {}", results);

    // 데이터 가공
    const basic = results.basic || {};
    const rank = results.rank || {};
    const recent = results.recent || {};
    const tier = results.tier || {};
    const match =
      results.match && results.match.match && results.match.match.length > 0
        ? results.match.match[0]
        : null; // match.match 배열을 확인하고 첫 번째 항목 가져옴

    console.log("Match Data:", match);

    const embed = new EmbedBuilder()
      .setColor("#ff6600") // 밝은 주황색으로 강조
      .setTitle(`⚡ **${suddenName}의 전적 정보** ⚡`)
      .setThumbnail("https://example.com/avatar.png") // 사용자 아바타 넣기
      .setDescription(`**게임 모드**: ${gameMode} | **닉네임**: ${suddenName}`)
      .addFields(
        {
          name: "📌 **기본 정보**",
          value:
            `닉네임: ${basic.user_name || "N/A"}\n` +
            `소속 클랜: ${basic.clan_name || "N/A"}\n` +
            `매너 등급: ${basic.manner_grade || "N/A"}`,
          inline: true, // 인라인으로 배치
        },
        {
          name: "🏅 **티어 정보**",
          value:
            `솔로 랭크 티어: ${tier.solo_rank_match_tier || "UNRANK"}\n` +
            `솔로 랭크 점수: ${tier.solo_rank_match_score || "N/A"}\n` +
            `파티 랭크 티어: ${tier.party_rank_match_tier || "UNRANK"}\n` +
            `파티 랭크 점수: ${tier.party_rank_match_score || "N/A"}`,
          inline: true,
        },
        {
          name: "🏆 **계급 정보**",
          value:
            `통합 계급: ${rank.grade || "N/A"}\n` +
            `통합 계급 랭킹: ${rank.grade_ranking + "위" || "N/A"}\n` +
            `시즌 계급: ${rank.season_grade || "N/A"}\n` +
            `시즌 계급 랭킹: ${rank.season_grade_ranking + "위" || "N/A"}`,
          inline: true,
        },
        {
          name: "🕹 **최근 동향**",
          value:
            `최근 승률: ${recent.recent_win_rate || "N/A"}\n` +
            `최근 킬데스: ${
              recent.recent_kill_death_rate
                ? recent.recent_kill_death_rate + "%"
                : "N/A"
            }\n` +
            `최근 돌격소총 킬데스: ${recent.recent_assault_rate || "N/A"}%\n` +
            `최근 저격소총 킬데스: ${recent.recent_sniper_rate || "N/A"}%\n` +
            `최근 특수총 킬데스: ${recent.recent_special_rate || "N/A"}%`,
          inline: true,
        }
      )
      .setFooter({
        text: "Sudden Attack Stats 🔥",
        iconURL: "https://example.com/footer-icon.png",
      }) // 푸터에 아이콘 추가
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
