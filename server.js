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

// 카카오 로그인 엔드포인트
app.post("/oauth", async (req, res) => {
    try {
        const { ACCESS_TOKEN } = req.body;

        if (!ACCESS_TOKEN) {
            return res.status(400).json({
                result: 'fail',
                error: "액세스 토큰이 필요합니다."
            });
        }

        // 카카오 사용자 정보 요청
        const userResponse = await axios.get(
            "https://kapi.kakao.com/v2/user/me",
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                }
            }
        );

        const { id, properties } = userResponse.data;
        const { nickname } = properties;

        // 성공 응답
        res.json({
            result: 'success',
            data: {
                id,
                nickname,
                properties
            }
        });

    } catch (error) {
        console.error("카카오 로그인 처리 중 오류:", error.response?.data || error.message);
        res.status(500).json({
            result: 'fail',
            error: "카카오 로그인 처리 중 오류가 발생했습니다."
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