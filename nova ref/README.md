# NOVA reference website

현재 NOVA 웹사이트의 독립 실행 가능한 정적 HTML 소스입니다.

- `index.html`: 메인 페이지, 얼굴 색 전환과 캐릭터 모션
- `device.html`, `features.html`, `story.html`: 제품 소개
- `guide.html`: 사용 가이드
- `play.html`: 미니 게임 3종
- `beta.html`, `privacy.html`, `safety.html`, `support.html`: 신청 및 안내
- `assets/`: 이미지, 스타일, 스크립트, 커서 및 사운드 코드

이 폴더를 정적 웹 서버의 루트로 지정하면 실행할 수 있습니다. 별도 패키지 설치나 빌드는 필요하지 않습니다.

Python이 설치되어 있다면 이 폴더에서 `python -m http.server 4173`을 실행한 다음 `http://localhost:4173`을 열어주세요.

이미지 기반 캐릭터 모션, 픽셀 커서와 입자 효과, 사용자가 켜는 배경음 및 버튼 효과음을 포함합니다.
