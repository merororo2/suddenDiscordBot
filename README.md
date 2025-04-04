# Sudden Attack 전적 조회 봇

이 프로젝트는 **Sudden Attack** 게임의 플레이어 전적을 디스코드에서 쉽게 조회할 수 있는 **디스코드 봇**입니다. 사용자는 디스코드 채팅에서 간단한 명령어를 통해 다른 플레이어의 전적 정보를 확인할 수 있습니다.

## 🚀 기능

- **전적 조회**: 사용자는 디스코드에서 `!전적 <닉네임>` 명령어를 통해 Sudden Attack 전적을 조회할 수 있습니다.
- **전적 정보 제공**: 전적 정보는 기본 정보, 티어 정보, 계급 정보, 최근 동향 등을 포함합니다.

## 💡 사용 방법

1. **디스코드 봇 추가**: 
    - 봇을 디스코드 서버에 초대하려면 해당 봇의 초대 링크를 통해 서버에 추가하십시오.

2. **명령어 사용법**: 
    - `!전적 <닉네임>` 형식으로 명령어를 입력합니다.
    - 예시: `!전적 Eunki88 `
      
3. **출력 예시**:
    - 전적 조회 결과는 디스코드 Embed 메시지 형태로 제공됩니다.
    - 결과에는 기본 정보, 티어 정보, 계급 정보, 최근 동향 등의 정보가 포함됩니다.
   
   **[수정전 출력 이미지]**
     ![image](https://github.com/user-attachments/assets/8ef29c4f-07ba-407f-b403-5c5f69cf25df)
   
   **[수정후 출력 이미지]**
     ![슬래시1](https://github.com/user-attachments/assets/09e55654-a02f-4d3d-813e-a4ec239e8680)
     ![슬래시2](https://github.com/user-attachments/assets/e5a2c6a3-98d2-410c-9035-4094ea53bae9)
   
     > slash command로 변경 후 /전적으로 검색합니다
      
     ![슬래시3](https://github.com/user-attachments/assets/ad584349-7d3b-4cf2-9141-8513a05bd82d)
   
     > 전적정보 간략화 및 최근동향 prograss bar로 수정
## 🔧 설치

1. **프로젝트 클론**:
    ```bash
    git clone https://github.com/merororo2/suddenDiscordBot.git
    cd suddenDiscordBot
    ```

2. **필요한 패키지 설치**:
    ```bash
    npm install
    ```

3. **환경 설정**:
    - `config.json` 파일에 **디스코드 봇 토큰**과 **Nexon API 토큰**을 입력합니다.
    - 예시:
        ```json
        {
          "token": "YOUR_DISCORD_BOT_TOKEN",
          "suddenToken": "YOUR_NEXON_API_KEY"
        }
        ```

4. **디스코드 봇 실행**:
    ```bash
    node index.js
    ```

## 🔗 링크
- [GitHub Repository](https://github.com/merororo2/suddenDiscordBot)
- [Nexon Open API Documentation](https://openapi.nexon.com/ko/)

## 추후 추가 할 기능
- 매치 유형별 검색 추가 예정 (ex: 클랜전, 랭크전 등)
- 추후 매치 목록 추가 예정 (ex: 최근 매치 기준 20판
  > 현재 api쪽에서 문제가 있어 추가 하는데 시간이 들꺼같음

## 수정사항
### 2025-03-25
- Nexon Open API 사이트로 이동되지 않아 주소 수정
- 매치 정보 예상치 못한 오류로 인해 제거

### 2025-03-26
- 전적 정보 간략하게 보이도록 수정
- 최근 동향 progress bar로 변경
- `!전적`에서 slash commands로 변경
- /전적 닉네임만 입력 시 전적정보만 나오고 게임모드까지 입력하면 새로운 embed에 매치 목록이 나오도록 수정(내일 github commit 예정) 

