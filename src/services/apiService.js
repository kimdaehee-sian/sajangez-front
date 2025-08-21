// API 서비스 - 백엔드와 통신하는 모든 함수들

const API_BASE_URL = 'http://localhost:8080/api';

// API 호출 헬퍼 함수
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 백엔드 응답 구조: { success: true, data: [...] }
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      throw new Error(data.error || 'API 요청 실패');
    }
  } catch (error) {
    console.error('API 호출 오류:', error);
    return { success: false, error: error.message };
  }
};

// 매출 관련 API 함수들
export const salesAPI = {
  // 사용자별 전체 매출 조회
  getSalesByUser: async (userId) => {
    return await apiCall(`/sales/user/${encodeURIComponent(userId)}`);
  },

  // 기간별 매출 조회
  getSalesByDateRange: async (userId, startDate, endDate) => {
    const url = `/sales/user/${encodeURIComponent(userId)}/range?startDate=${startDate}&endDate=${endDate}`;
    return await apiCall(url);
  },

  // 특정 날짜 매출 조회
  getSaleByDate: async (userId, date) => {
    return await apiCall(`/sales/user/${encodeURIComponent(userId)}/date/${date}`);
  },

  // 매출 통계 조회
  getSalesStatistics: async (userId) => {
    return await apiCall(`/sales/user/${encodeURIComponent(userId)}/statistics`);
  },

  // 매출 생성/수정
  createSale: async (saleData) => {
    return await apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  // 매출 삭제
  deleteSale: async (saleId, userId) => {
    return await apiCall(`/sales/${saleId}/user/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },
};

// 사용자 매핑 (데모 사용자 → 실제 DB 사용자)
export const userMapping = {
  'user1': 'rlaeogml0724@naver.com', // 김대희
  'user2': 'rladlsgy@naver.com',     // 김인호  
  'user3': 'dbswldnjs@naver.com',    // 윤지원
  'user4': 'wjdtndud@naver.com',     // 정수영
};

// 실제 사용자 정보 매핑
export const realUserInfo = {
  'rlaeogml0724@naver.com': {
    id: 'rlaeogml0724@naver.com',
    email: 'rlaeogml0724@naver.com',
    name: '김대희',
    stores: [{
      id: 'store1',
      name: '인호네 마라탕',
      businessType: '중식',
      address: '서울특별시 강남구 태헌로6 129'
    }]
  },
  'rladlsgy@naver.com': {
    id: 'rladlsgy@naver.com',
    email: 'rladlsgy@naver.com',
    name: '김인호',
    stores: [{
      id: 'store1',
      name: '인다방',
      businessType: '카페',
      address: '서울특별시 강남구 태헌로6 152'
    }]
  },
  'dbswldnjs@naver.com': {
    id: 'dbswldnjs@naver.com',
    email: 'dbswldnjs@naver.com',
    name: '윤지원',
    stores: [{
      id: 'store1',
      name: '윤초밥',
      businessType: '일식',
      address: '서울특별시 성동구 성수동2가 315-71'
    }]
  },
  'wjdtndud@naver.com': {
    id: 'wjdtndud@naver.com',
    email: 'wjdtndud@naver.com',
    name: '정수영',
    stores: [{
      id: 'store1',
      name: '정식당',
      businessType: '한식',
      address: '서울특별시 중구구 게동길 17'
    }]
  }
};

// 데이터 변환 함수들
export const dataTransformers = {
  // 백엔드 매출 데이터를 프론트엔드 형식으로 변환
  transformSaleData: (apiSaleData) => {
    return {
      date: apiSaleData.saleDate,
      amount: Number(apiSaleData.amount),
      storeName: apiSaleData.storeName,
      businessType: apiSaleData.businessType,
      id: apiSaleData.id,
      userId: apiSaleData.userId,
      createdAt: apiSaleData.createdAt,
      updatedAt: apiSaleData.updatedAt
    };
  },

  // 프론트엔드 매출 데이터를 백엔드 형식으로 변환
  transformToApiFormat: (frontendSaleData, userId) => {
    return {
      userId: userId,
      saleDate: frontendSaleData.date,
      amount: frontendSaleData.amount,
      storeName: frontendSaleData.storeName,
      businessType: frontendSaleData.businessType
    };
  }
};

// 사용자 관련 API 함수들
export const userAPI = {
  // 사용자 정보 조회
  getUserInfo: async (email) => {
    return await apiCall(`/users/${encodeURIComponent(email)}`);
  },

  // 사용자 정보 수정
  updateUser: async (email, userData) => {
    return await apiCall(`/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// 헬스체크 함수 (API 엔드포인트 사용)
export const healthCheck = async () => {
  try {
    // actuator 대신 실제 API 엔드포인트로 테스트
    const response = await fetch('http://localhost:8080/api/sales/user/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    // 404나 다른 응답이라도 서버가 응답하면 연결된 것
    return true;
  } catch (error) {
    console.error('백엔드 서버 연결 실패:', error);
    return false;
  }
}; 