# Firebase 연동 가이드

## 1. Firebase 프로젝트 설정 확인

Firebase 콘솔에서 다음 사항을 확인하세요:

- 프로젝트가 올바르게 생성되었는지 확인
- 웹 앱이 프로젝트에 등록되었는지 확인
- Firestore 데이터베이스가 생성되었는지 확인
- Storage(필요한 경우)가 설정되었는지 확인

## 2. 보안 규칙 설정

Firestore와 Storage의 보안 규칙을 적절히 설정하세요. 기본적으로 테스트를 위해서는 `firestore-rules.txt` 파일의 내용을 참조하세요.

## 3. CORS 이슈 해결 방법

로컬에서 개발 시 CORS(Cross-Origin Resource Sharing) 이슈가 발생할 수 있습니다:

1. **Firebase 호스팅 사용하기**:
   - Firebase 호스팅에 배포하면 CORS 이슈가 해결됩니다.
   ```
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy
   ```

2. **로컬 개발 서버 설정**:
   - Chrome 확장 프로그램 'Web Server for Chrome'을 사용하여 로컬 파일을 서빙
   - VS Code의 Live Server 확장 프로그램 사용
   - 또는 `npx serve` 명령으로 간단히 서버 실행

3. **CORS 프록시 사용**:
   - 개발 중에는 CORS Anywhere와 같은 프록시 서비스 사용 가능

## 4. 일반적인 오류 해결

1. **"Firebase App named '[DEFAULT]' already exists"**:
   - 이미 Firebase가 초기화된 경우 발생
   - 해결: 초기화 코드가 한 번만 실행되도록 확인

2. **"Missing or insufficient permissions"**:
   - Firestore 보안 규칙 문제
   - 해결: Firebase 콘솔에서 보안 규칙 확인 및 수정

3. **API 키 관련 오류**:
   - API 키가 올바르지 않거나 제한되어 있을 수 있음
   - 해결: Firebase 콘솔에서 API 키 확인 및 필요시 재생성

4. **"Cannot read property 'collection' of undefined"**:
   - Firestore가 올바르게 초기화되지 않았을 때 발생
   - 해결: 초기화 순서 확인 및 수정

## 5. 데이터 구조 설계

Firestore에서 권장하는 데이터 구조 설계 원칙:

1. **중첩 데이터 지양**: 과도한 중첩은 피하고, 필요시 별도 컬렉션 사용
2. **컬렉션과 문서 ID**: 의미 있는 ID 사용 고려
3. **색인 설정**: 쿼리 성능 최적화를 위한 색인 구성

## 6. 배포 전 체크리스트

- firebase-config.js의 API 키 등 민감 정보 보호 고려
- 보안 규칙 재검토
- 인증 방식 확정
- 성능 테스트 수행 