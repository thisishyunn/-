/**
 * Firebase 연결을 테스트하는 스크립트
 * 
 * 이 파일은 파이어베이스 연결을 확인하기 위한 간단한 테스트 스크립트입니다.
 * 브라우저 콘솔에서 실행하거나, 테스트용 HTML 파일에 포함시켜 사용할 수 있습니다.
 */

(function() {
    console.log('=== Firebase 연결 테스트 시작 ===');
    
    // Firebase 초기화 확인
    try {
        console.log('Firebase 앱 이름:', firebase.app().name);
        console.log('Firebase SDK 버전:', firebase.SDK_VERSION);
        console.log('Firebase 초기화 상태: 성공');
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        return;
    }
    
    // Firestore 접근 테스트
    try {
        if (typeof db !== 'undefined') {
            console.log('Firestore 인스턴스 존재:', !!db);
            
            // 테스트 쿼리 실행
            console.log('Firestore 테스트 쿼리 실행 중...');
            
            db.collection('contents').limit(1).get()
                .then(snapshot => {
                    console.log('Firestore 쿼리 성공!');
                    console.log('데이터 존재 여부:', !snapshot.empty);
                    
                    if (!snapshot.empty) {
                        const doc = snapshot.docs[0];
                        console.log('샘플 문서 ID:', doc.id);
                        console.log('샘플 문서 데이터:', doc.data());
                    }
                    
                    console.log('=== Firebase 연결 테스트 완료 ===');
                })
                .catch(error => {
                    console.error('Firestore 쿼리 실패:', error);
                    console.log('=== Firebase 연결 테스트 실패 ===');
                    
                    // 일반적인 오류 원인 진단
                    if (error.code === 'permission-denied') {
                        console.log('진단: Firebase 보안 규칙에 의해 접근이 거부되었습니다.');
                        console.log('해결책: Firebase 콘솔에서 보안 규칙을 확인하세요.');
                    } else if (error.code === 'unavailable') {
                        console.log('진단: Firebase 서비스에 연결할 수 없습니다.');
                        console.log('해결책: 인터넷 연결을 확인하거나, Firebase 서비스 상태를 확인하세요.');
                    } else if (error.code === 'not-found') {
                        console.log('진단: 데이터베이스 또는 컬렉션이 존재하지 않습니다.');
                        console.log('해결책: Firebase 콘솔에서 Firestore 데이터베이스가 생성되었는지 확인하세요.');
                    }
                });
        } else {
            console.error('Firestore 인스턴스를 찾을 수 없습니다. firebase-config.js 파일을 확인하세요.');
        }
    } catch (error) {
        console.error('Firestore 테스트 중 오류 발생:', error);
    }
    
    // Firebase 스토리지 테스트 (선택 사항)
    try {
        if (typeof storage !== 'undefined') {
            console.log('Firebase Storage 인스턴스 존재:', !!storage);
        } else {
            console.log('Firebase Storage 인스턴스가 설정되지 않았거나 사용하지 않습니다.');
        }
    } catch (error) {
        console.log('Firebase Storage 테스트 중 오류 발생:', error);
    }
})(); 