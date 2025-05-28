const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS 설정 - 프로덕션 환경용
app.use(cors({
    origin: [
        'https://devops1.store',
        'exp://localhost:8081',
        'exp://192.168.0.1:8081'  // 개발 환경에서 사용하는 IP
    ],
    credentials: true
}));
app.use(express.json());

// OAuth 리다이렉트 처리 엔드포인트
app.post("/oauth", async (req, res) => {
  console.log(req.body);
  const { ACCESS_TOKEN } = req.body;
  let tmp;
  try {
    const url = 'https://kapi.kakao.com/v2/user/me';
    const Header = {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    };
    tmp = await axios.get(url, Header);
  } catch (e) {
    console.log('액시오스 에러');
    console.log(e);

    const response = {
      result: 'fail',
      error: '토큰 에러',
    };

    res.send(response);
    return;
  }

  try {
    const { data } = tmp;
    const { id, properties } = data;
    const { nickname } = properties;

    const result = await Users.findOne({ where: { u_id: id } });

    if (result) {
      const response = {
        result: 'success',
        data: result,
      };
      res.send(response);
    } else {
      const payload = {
        u_id: id,
        u_alias: nickname,
      };
      await Users.create(payload);
      const data = (await Users.findOne({ where: { u_id: id } }));
      const response = {
        result: 'success',
        data,
      };

      res.send(response);
    }
  } catch (e) {
    console.log(e);
    let msg = '';
    if (typeof e === 'string') {
      msg = e;
    } else if (e instanceof Error) {
      msg = e.message;
    }
    const response = {
      result: 'fail',
      error: msg,
    };

    res.send(response);
  }
});

// 카카오 로그인 엔드포인트
app.post("/api/auth/kakaoapp", async (req, res) => {
    try {
        const { code, redirectUri } = req.body;

        if (!code || !redirectUri) {
            return res.status(400).json({
                success: false,
                message: "인가 코드와 리다이렉트 URI가 필요합니다."
            });
        }

        // 카카오 토큰 요청
        const tokenResponse = await axios.post(
            "https://kauth.kakao.com/oauth/token",
            {
                grant_type: "authorization_code",
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: redirectUri,
                code: code
            },
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            }
        );

        const { access_token } = tokenResponse.data;

        // 카카오 사용자 정보 요청
        const userResponse = await axios.get(
            "https://kapi.kakao.com/v2/user/me",
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            }
        );

        const { id, kakao_account } = userResponse.data;
        const { email, profile } = kakao_account;

        // 여기서 사용자 정보를 데이터베이스에 저장하거나 업데이트하는 로직을 추가할 수 있습니다.
        // 예시: await User.findOneAndUpdate({ kakaoId: id }, { email, name: profile.nickname }, { upsert: true });

        // JWT 토큰 생성 (선택사항)
        // const token = jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            success: true,
            data: {
                id,
                email,
                nickname: profile.nickname,
                profile_image: profile.profile_image_url,
                // token // JWT 토큰을 사용하는 경우
            }
        });

    } catch (error) {
        console.error("카카오 로그인 처리 중 오류:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "카카오 로그인 처리 중 오류가 발생했습니다."
        });
    }
});

// 서버 상태 확인 엔드포인트
app.get("/", (req, res) => {
    res.send("<div>서버가 정상적으로 실행 중입니다.</div>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});