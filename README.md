# 사장EZ 프론트엔드

소상공인을 위한 매출 관리 플랫폼의 웹 애플리케이션입니다.

## ✨ 주요 기능

- 📊 **매출 입력**: 일별 매출 데이터 입력 및 관리
- 📈 **매출 리포트**: 일별/월별 매출 현황 및 통계
- 🏪 **매출 비교**: 주변 지역과의 매출 비교 분석 (시뮬레이션)
- 👥 **유동인구 분석**: 연령대별/성별 인구 분포 피라미드 (시뮬레이션)
- 🔐 **사용자 인증**: 안전한 로그인/회원가입 시스템

## 🛠 기술 스택

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Charts**: Recharts
- **Icons**: Lucide React
- **Development**: TurboPack for fast builds
- **Language**: JavaScript (TypeScript에서 변환)
- **Package Manager**: npm

## 🚀 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정 (선택사항)

Supabase를 사용하려는 경우 `.env.local` 파일을 생성:

```env
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_supabase_project_id
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**참고**: 현재는 로컬 스토리지 기반 데모 모드로 동작하므로 환경변수 없이도 사용 가능합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인할 수 있습니다.

### 4. 빌드 및 프로덕션

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 프리뷰
npm run preview
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.js          # 루트 레이아웃
│   └── page.js            # 메인 페이지 (전체 앱)
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   │   ├── button.js     # 버튼 컴포넌트
│   │   ├── card.js       # 카드 컴포넌트
│   │   └── tabs.js       # 탭 컴포넌트
│   ├── LoginForm.js      # 로그인 폼
│   └── SignupForm.js     # 회원가입 폼
├── lib/                  # 유틸리티 함수
│   └── utils.js          # 클래스명 병합 유틸
└── utils/                # 설정 및 유틸리티
    └── supabase/         # Supabase 설정
        └── info.js       # 프로젝트 정보
```

## 🎯 사용법

### 1. 회원가입/로그인
- 매장 정보와 함께 계정 생성
- 데모 모드에서는 임의의 이메일/비밀번호로 가능

### 2. 매출 입력
- 일별 매출 데이터 입력
- 같은 날짜 중복 입력 시 자동 업데이트
- localStorage에 데이터 저장

### 3. 대시보드
- 매장 정보 확인
- 빠른 기능 접근 메뉴

### 4. 매출 분석 (개발 예정)
- 매출 리포트 및 차트
- 지역별 매출 비교
- 유동인구 분석

## 🔧 커스터마이징

### 스타일 수정
- `src/app/globals.css`: 글로벌 스타일 및 CSS 변수
- `tailwind.config.js`: Tailwind CSS 설정
- 각 컴포넌트 파일: 개별 컴포넌트 스타일

### 새로운 컴포넌트 추가
1. `src/components/` 또는 `src/components/ui/`에 파일 생성
2. 기존 컴포넌트 패턴 참고
3. `src/app/page.js`에서 import 및 사용

### 데이터 저장소 변경
현재 localStorage 기반이지만, 백엔드 API로 변경 시:
1. `src/app/page.js`의 데이터 함수들 수정
2. axios 또는 fetch를 사용한 API 호출로 변경
3. 환경변수로 API 엔드포인트 설정

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: Blue (600, 700)
- **Success**: Green (400, 600)
- **Warning**: Orange (400, 600)
- **Error**: Red (400, 600)
- **Gray Scale**: 50-900

### 컴포넌트 가이드
- **버튼**: 다양한 variant와 size 지원
- **카드**: 그림자와 둥근 모서리
- **입력 필드**: focus 상태 스타일링
- **아이콘**: Lucide React 라이브러리 사용

## 🚨 문제 해결

### 자주 발생하는 오류

1. **의존성 설치 오류**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **빌드 오류**
   ```bash
   npm run build
   # 오류 메시지 확인 후 해당 파일 수정
   ```

3. **포트 충돌**
   - 다른 포트 사용: `npm run dev -- -p 3001`

### 개발 팁

1. **Hot Reload**: 파일 저장 시 자동 새로고침
2. **TurboPack**: 빠른 빌드를 위해 `--turbo` 플래그 사용
3. **브라우저 개발자 도구**: 콘솔에서 디버그 로그 확인

## 📱 반응형 디자인

- **모바일**: 360px 이상
- **태블릿**: 768px 이상  
- **데스크톱**: 1024px 이상
- **와이드**: 1440px 이상

모든 주요 기능이 모바일에서도 완전히 작동합니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 제공됩니다.

---

**사장EZ** - 전국 모든 가게의 경쟁력을 높이는 일상 파트너 🚀
