// Firebase 설정
// 실제 프로젝트에서는 이 값들을 실제 Firebase 프로젝트 설정으로 교체해야 합니다.
const firebaseConfig = {
    apiKey: "AIzaSyDevFo1s3F11IP8qxV4Frdd6rvK_YA706U",
    authDomain: "project-xpz.firebaseapp.com",
    projectId: "project-xpz",
    storageBucket: "project-.firebasestorage.app",
    messagingSenderId: "137595532557",
    appId: "1:137595532557:web:b9ca51e41c94f0d8e76c44",
    measurementId: "G-FH6J1ZSKEP"
  };

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 참조 생성
const db = firebase.firestore();
const storage = firebase.storage();

// Firebase 인증 참조
const auth = firebase.auth();

// Firebase 서비스를 export
window.db = db;
window.storage = storage;
window.auth = auth; 