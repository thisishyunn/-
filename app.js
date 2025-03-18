// DOM 요소 참조
const contentContainer = document.getElementById('content-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const loadingIndicator = document.getElementById('loading-indicator');
const contentModal = document.getElementById('content-modal');
const modalContentContainer = document.getElementById('modal-content-container');
const closeModal = document.querySelector('.close-modal');
const appDownloadBtn = document.getElementById('app-download-btn');
const appInstallBtns = document.querySelectorAll('.app-install-btn');
const scrollTopBtn = document.getElementById('scroll-top-btn');

// 상태 변수
let lastDoc = null;
let isLoading = false;
let currentQuery = null;
let searchTerm = '';
const currentSort = 'newest';
const ITEMS_PER_PAGE = 12;

// 앱으로 리디렉션하는 함수
function redirectToApp() {
    // 앱 다운로드 URL 설정
    const appDownloadUrl = 'https://projectxpz.supalink.cc/store';
    window.open(appDownloadUrl, '_blank');
}

// 앱 설치 버튼 이벤트 리스너
appDownloadBtn.addEventListener('click', redirectToApp);
appInstallBtns.forEach(btn => {
    btn.addEventListener('click', redirectToApp);
});

// 모달 닫기 이벤트 리스너
closeModal.addEventListener('click', () => {
    contentModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
    if (e.target === contentModal) {
        contentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// 날짜 포맷팅 함수
function formatDate(timestamp) {
    let date;
    
    if (!timestamp) {
        // 타임스탬프가 없는 경우 현재 날짜 사용
        date = new Date();
        console.log('날짜 없음, 현재 날짜 사용');
    } else if (timestamp instanceof Date) {
        // 이미 Date 객체인 경우
        date = timestamp;
    } else if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
        // Firestore 타임스탬프 객체인 경우
        date = new Date(timestamp.seconds * 1000);
        console.log('Firestore 타임스탬프 변환:', date);
    } else {
        // 숫자(밀리초) 또는 문자열
        date = new Date(timestamp);
        console.log('일반 타임스탬프 변환:', date);
    }
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
        console.error('유효하지 않은 날짜:', timestamp);
        return '날짜 정보 없음';
    }
    
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
}

// 가격 포맷팅 함수
function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR').format(price) + 'P';
}

// 플립 카드 생성 함수
function createCard(doc) {
    const data = doc.data();
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = doc.id;
    
    // 썸네일 이미지 URL
    const imageUrl = data.coverUrl || 'https://via.placeholder.com/300x533?text=No+Image'; // 9:16 비율
    
    // 날짜 포맷팅
    const formattedDate = formatDate(data.createdAt);
    
    // 가격 포맷팅
    const formattedPrice = formatPrice(data.price || 0);
    
    // 카드 내부 HTML 구성
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">
                <img src="${imageUrl}" alt="${data.id || '콘텐츠'}" class="card-thumbnail">
                <div class="flip-hint">클릭하여 상세 정보 보기</div>
            </div>
            <div class="card-back">
                <div class="card-date">${formattedDate}</div>
                <div class="card-description">${data.description || '설명이 없습니다.'}</div>
                <div class="card-action">
                    <button class="card-button install-app-button">${data.price === 0 ? '나눔' : formattedPrice}</button>
                </div>
            </div>
        </div>
    `;
    
    // 카드 클릭 이벤트 - 플립 효과
    card.addEventListener('click', (e) => {
        // 버튼 클릭 시 이벤트 전파 방지
        if (e.target.classList.contains('install-app-button') || 
            e.target.closest('.install-app-button')) {
            return; // 아무 동작도 하지 않음 (이벤트 위임으로 처리)
        }
        // 그 외는 플립
        card.classList.toggle('flipped');
    });
    
    return card;
}

// 콘텐츠 모달 열기 함수
function openContentModal(doc) {
    const data = doc.data();
    const imageUrl = data.coverUrl || 'https://via.placeholder.com/800x450?text=No+Image';
    const formattedDate = formatDate(data.createdAt);
    const formattedPrice = formatPrice(data.price || 0);
    
    modalContentContainer.innerHTML = `
        <img src="${imageUrl}" alt="${data.id || '콘텐츠'}" class="modal-image">
        <h2 class="modal-title">${data.id || '제목 없음'}</h2>
        <div class="modal-price">${formattedPrice}</div>
        <div class="modal-meta">
            <span>ID: ${data.id || 'N/A'}</span>
            <span>작성일: ${formattedDate}</span>
            <span>작성자: ${data.creatorId || 'N/A'}</span>
        </div>
        <p class="modal-description">${data.description || '설명이 없습니다.'}</p>
    `;
    
    contentModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

// Firestore에서 콘텐츠 가져오기
function fetchContents() {
    if (isLoading) return;
    
    isLoading = true;
    // 부드러운 로딩 인디케이터 표시
    showLoadingIndicator();
    console.log('콘텐츠 가져오기 시작...');
    
    // 쿼리 생성
    let query = db.collection('xps');
    
    // 검색어 필터 적용
    if (searchTerm) {
        console.log('검색어 적용:', searchTerm);
        // ID 필드로 검색 (대소문자 구분 없이)
        query = query.where('id', '>=', searchTerm.toLowerCase())
                     .where('id', '<=', searchTerm.toLowerCase() + '\uf8ff');
    }
    
    // 항상 최신순으로 정렬
    query = query.orderBy('createdAt', 'desc');
    
    // 페이지네이션
    if (lastDoc) {
        query = query.startAfter(lastDoc);
    }
    
    console.log('Firestore 쿼리 실행...');
    
    query.limit(ITEMS_PER_PAGE)
        .get()
        .then((snapshot) => {
            console.log('쿼리 완료. 결과 수:', snapshot.size);
            hideLoadingIndicator();
            
            if (snapshot.empty) {
                console.log('검색 결과 없음');
                if (!lastDoc) {
                    contentContainer.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
                }
                isLoading = false;
                return;
            }
            
            // 마지막 문서 저장
            lastDoc = snapshot.docs[snapshot.docs.length - 1];
            
            // 결과 표시
            snapshot.forEach((doc) => {
                console.log('문서 ID:', doc.id);
                const card = createCard(doc);
                contentContainer.appendChild(card);
            });
            
            isLoading = false;
        })
        .catch((error) => {
            console.error('콘텐츠를 가져오는 중 오류 발생:', error);
            hideLoadingIndicator();
            
            contentContainer.innerHTML += '<p class="error-message">데이터를 불러오는 중 오류가 발생했습니다.</p>';
            
            isLoading = false;
        });
}

// 로딩 인디케이터 표시/숨김 함수
function showLoadingIndicator() {
    // 현재 스크롤 위치 저장
    const currentScroll = window.scrollY;
    
    // 로딩 인디케이터를 현재 보이는 화면 영역의 아래쪽에 배치
    loadingIndicator.style.position = 'relative';
    
    loadingIndicator.style.display = 'block';
    // 강제 리플로우를 통해 트랜지션이 적용되도록 함
    loadingIndicator.offsetHeight;
    loadingIndicator.classList.add('visible');
    
    // 로딩 텍스트에 애니메이션 추가
    animateLoadingText();
}

function hideLoadingIndicator() {
    loadingIndicator.classList.remove('visible');
    // 애니메이션 제거
    clearInterval(loadingTextAnimationInterval);
    
    // 트랜지션이 완료된 후 display:none 설정
    setTimeout(() => {
        if (!loadingIndicator.classList.contains('visible')) {
            loadingIndicator.style.display = 'none';
        }
    }, 500); // CSS 트랜지션 시간과 동일하게 설정
}

// 로딩 텍스트 애니메이션
let loadingTextAnimationInterval;
function animateLoadingText() {
    // 이전 애니메이션 제거
    clearInterval(loadingTextAnimationInterval);
    
    const loadingText = loadingIndicator.querySelector('p');
    const baseText = '새로운 콘텐츠를 불러오는 중';
    let dots = '';
    
    loadingTextAnimationInterval = setInterval(() => {
        dots = dots.length >= 3 ? '' : dots + '.';
        loadingText.textContent = baseText + dots;
    }, 400);
}

// 검색 실행 함수
function performSearch() {
    searchTerm = searchInput.value.trim();
    resetContentContainer();
    fetchContents();
}

// 검색 버튼 이벤트 리스너
searchButton.addEventListener('click', performSearch);

// 엔터 키 검색 이벤트 리스너
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// 콘텐츠 컨테이너 초기화 함수
function resetContentContainer() {
    contentContainer.innerHTML = '';
    lastDoc = null;
}

// 앱 설치 다이얼로그 관련 함수들
function showInstallDialog() {
  const dialog = document.getElementById('app-install-dialog');
  dialog.style.display = 'flex';
}

function hideInstallDialog() {
  const dialog = document.getElementById('app-install-dialog');
  dialog.style.display = 'none';
}

// 스크롤 업 버튼 표시/숨김 및 이벤트 리스너
function setupScrollTopButton() {
  window.addEventListener('scroll', throttle(function() {
    // 스크롤이 300px 이상일 때 버튼 표시
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }, 200));
  
  // 스크롤 업 버튼 클릭 이벤트
  scrollTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// 초기화 함수에 이벤트 리스너 추가
function init() {
  // 앱 설치 다이얼로그 이벤트 리스너 설정
  document.querySelectorAll('.install-app-button').forEach(button => {
    button.addEventListener('click', showInstallDialog);
  });
  
  document.getElementById('cancel-install').addEventListener('click', hideInstallDialog);
  document.querySelector('.close-dialog').addEventListener('click', hideInstallDialog);
  
  document.getElementById('confirm-install').addEventListener('click', () => {
    // 실제 앱 설치 페이지로 리디렉션
    redirectToApp();
    hideInstallDialog();
  });
  
  // 다이얼로그 외부 클릭 시 닫기
  document.getElementById('app-install-dialog').addEventListener('click', (e) => {
    if (e.target === document.getElementById('app-install-dialog')) {
      hideInstallDialog();
    }
  });
  
  // 무한 스크롤 설정
  setupInfiniteScroll();
  
  // 스크롤 업 버튼 설정
  setupScrollTopButton();
}

// 앱 초기화
function initApp() {
  init();
  loadCards();
  setupInfiniteScroll(); // 초기 무한 스크롤 설정
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initApp);

// 이전 중복 리스너 제거
// document.addEventListener('DOMContentLoaded', () => {
//   init();
//   loadCards();
// });

// 카드 데이터 로드 함수
function loadCards() {
  console.log('앱 초기화 중...');
  
  // Firebase 연결 상태 확인
  try {
    console.log('Firebase 연결 상태:', firebase.app().name ? '연결됨' : '연결 안됨');
    console.log('Firestore 사용 가능:', !!db);
    
    // 바로 콘텐츠 가져오기 실행
    fetchContents();
  } catch (error) {
    console.error('Firebase 초기화 중 오류 발생:', error);
    alert('Firebase 초기화에 실패했습니다. firebase-config.js 파일을 확인해주세요.');
  }
}

// 앱 다운로드 버튼 이벤트 리스너
appDownloadBtn.addEventListener('click', showInstallDialog);

// 동적으로 생성된 요소에 대한 이벤트 위임
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('install-app-button')) {
    e.stopPropagation(); // 버블링 중지
    showInstallDialog();
  }
});

// 스로틀 함수 구현
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

// 스로틀링된 스크롤 이벤트 핸들러 생성
const throttledHandleScroll = throttle(handleScroll, 200); // 200ms 스로틀링

// 무한 스크롤 구현
function setupInfiniteScroll() {
  // 이전 스크롤 이벤트 리스너 제거
  window.removeEventListener('scroll', throttledHandleScroll);
  
  // 스로틀링된 스크롤 이벤트 리스너 추가
  window.addEventListener('scroll', throttledHandleScroll);
}

// 스크롤 이벤트 핸들러
function handleScroll() {
  if (isLoading) return;
  
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const clientHeight = document.documentElement.clientHeight;
  
  // 페이지 하단에 완전히 도달했는지 확인
  if (scrollTop + clientHeight >= scrollHeight - 5) { // 거의 완전히 스크롤 끝에 도달했을 때
    console.log('스크롤 끝에 도달, 추가 콘텐츠 로드');
    
    // 로딩 시작 시 진동 피드백 제공 (모바일)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // 로딩 인디케이터를 현재 화면의 중앙 하단에 위치시키기 위한 스크롤 위치 계산
    const currentScroll = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    fetchContents();
  }
} 