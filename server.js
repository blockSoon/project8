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

// GET 요청 처리 엔드포인트 추가
app.get("/oauth", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({
      result: 'fail',
      error: "인가 코드가 필요합니다."
    });
  }

  try {
    // 카카오 토큰 요청
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code: code,
        client_secret: process.env.CLIENT_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // 성공 응답
    res.redirect(`/?access_token=${access_token}`);

  } catch (error) {
    console.error("카카오 로그인 처리 중 오류:", error.response?.data || error.message);
    res.status(500).json({
      result: 'fail',
      error: "카카오 로그인 처리 중 오류가 발생했습니다."
    });
  }
});

// 카카오 사용자 정보 요청
app.get("/", async (req, res) => {
    const { access_token } = req.query;
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
    
    const { id, properties } = userResponse.data;
    const { nickname } = properties;
    res.json(id, properties, nickname);

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
}); 