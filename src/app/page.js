'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { ClientOnly } from '../components/ClientOnly'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { salesAPI, userMapping, realUserInfo, dataTransformers, healthCheck } from '../services/apiService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Building2, TrendingUp, BarChart3, DollarSign, Calendar, MapPin, RefreshCw, Store, PieChart, Edit, ChevronLeft, ChevronRight, TrendingDown, AlertTriangle, Target, Lightbulb, X, Check } from 'lucide-react'

// localStorage 키
const STORAGE_KEYS = {
  SALES_DATA: 'sajang_ez_sales_data',
  USER_DATA: 'sajang_ez_user_data'
}

// 디버깅을 위한 로그 함수
const debugLog = (message, data) => {
  console.log(`[사장EZ 디버그] ${message}`, data || '')
}

// API 헬퍼 함수들 (localStorage 대체)
const getSalesFromAPI = async (userId, storeId) => {
  try {
    debugLog('API에서 매출 데이터 조회 시도', { userId, storeId })
    const response = await salesAPI.getSalesByUser(userId)
    
    if (response.success) {
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      const transformedData = response.data.map(dataTransformers.transformSaleData)
      debugLog('API 매출 데이터 조회 성공', { count: transformedData.length, data: transformedData })
      return transformedData
    } else {
      debugLog('API 매출 데이터 조회 실패', response.error)
      return []
    }
  } catch (error) {
    debugLog('API 매출 데이터 조회 오류', error)
    return []
  }
}

// 백업용 localStorage 함수 (API 실패 시 사용)
const getSalesFromStorage = (userId, storeId) => {
  try {
    const allSalesData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES_DATA) || '{}')
    const storeKey = `${userId}_${storeId}`
    return allSalesData[storeKey] || []
  } catch {
    return []
  }
}

const saveSalesToStorage = (userId, storeId, salesData) => {
  try {
    const allSalesData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES_DATA) || '{}')
    const storeKey = `${userId}_${storeId}`
    allSalesData[storeKey] = salesData
    localStorage.setItem(STORAGE_KEYS.SALES_DATA, JSON.stringify(allSalesData))
    debugLog('매출 데이터 localStorage에 저장 완료', { userId, storeId, storeKey, dataCount: salesData.length })
  } catch (error) {
    debugLog('localStorage 저장 오류', error)
  }
}

const addSaleToAPI = async (userId, storeId, date, amount, storeName, businessType) => {
  try {
    // 날짜 문자열 검증 및 정규화
    const normalizedDate = date.trim()
    debugLog('API로 매출 데이터 저장 시도', { userId, storeId, originalDate: date, normalizedDate, amount })
    
    const saleData = {
      userId: userId,
      saleDate: normalizedDate,
      amount: Number(amount),
      storeName: storeName,
      businessType: businessType
    }
    
    const response = await salesAPI.createSale(saleData)
    
    if (response.success) {
      debugLog('API 매출 데이터 저장 성공', response.data)
      return { success: true, data: response.data }
    } else {
      debugLog('API 매출 데이터 저장 실패', response.error)
      return { success: false, error: response.error }
    }
  } catch (error) {
    debugLog('API 매출 데이터 저장 오류', error)
    return { success: false, error: error.message }
  }
}

// 백업용 localStorage 함수 (API 실패 시 사용)
const addSaleToStorage = (userId, storeId, date, amount) => {
  const existingSales = getSalesFromStorage(userId, storeId)
  
  // 날짜 문자열 검증 및 정규화
  const normalizedDate = date.trim()
  debugLog('localStorage 매출 데이터 저장 시도', { userId, storeId, originalDate: date, normalizedDate, amount })
  
  // 같은 날짜의 기존 데이터가 있으면 업데이트, 없으면 추가
  const existingIndex = existingSales.findIndex(sale => sale.date === normalizedDate)
  
  if (existingIndex >= 0) {
    existingSales[existingIndex] = { date: normalizedDate, amount }
    debugLog('기존 매출 데이터 업데이트', { date: normalizedDate, amount })
  } else {
    existingSales.push({ date: normalizedDate, amount })
    debugLog('새 매출 데이터 추가', { date: normalizedDate, amount })
  }
  
  // 날짜순 정렬 - 문자열 비교로 변경 (YYYY-MM-DD 형식이므로 안전)
  existingSales.sort((a, b) => a.date.localeCompare(b.date))
  
  saveSalesToStorage(userId, storeId, existingSales)
  debugLog('localStorage 매출 데이터 저장 완료', { date: normalizedDate, amount, totalCount: existingSales.length, allDates: existingSales.map(s => s.date) })
}

// 매장 추가 모달 컴포넌트
const AddStoreModal = ({ isOpen, onClose, onAddStore }) => {
  const [storeName, setStoreName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!storeName.trim() || !businessType.trim() || !address.trim()) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setLoading(true)
    
    try {
      const newStore = {
        name: storeName.trim(),
        businessType: businessType.trim(),
        address: address.trim()
      }
      
      await onAddStore(newStore)
      
      // 폼 초기화
      setStoreName('')
      setBusinessType('')
      setAddress('')
      onClose()
    } catch (error) {
      console.error('매장 추가 중 오류:', error)
      alert('매장 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStoreName('')
    setBusinessType('')
    setAddress('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">새 매장 추가</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="매장명 *"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="업종 (예: 카페, 식당, 편의점) *"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="주소 *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 매장 수정 모달 컴포넌트
const EditStoreModal = ({ isOpen, onClose, onEditStore, currentStore }) => {
  const [storeName, setStoreName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때 현재 매장 정보로 초기화
  useEffect(() => {
    if (isOpen && currentStore) {
      setStoreName(currentStore.name || '')
      setBusinessType(currentStore.businessType || '')
      setAddress(currentStore.address || '')
    }
  }, [isOpen, currentStore])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!storeName.trim() || !businessType.trim() || !address.trim()) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    setLoading(true)
    
    try {
      const updatedStoreData = {
        name: storeName.trim(),
        businessType: businessType.trim(),
        address: address.trim()
      }
      
      await onEditStore(updatedStoreData)
      onClose()
    } catch (error) {
      console.error('매장 수정 중 오류:', error)
      alert('매장 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStoreName('')
    setBusinessType('')
    setAddress('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">매장 정보 수정</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="매장명 *"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="업종 (예: 카페, 식당, 편의점) *"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              placeholder="주소 *"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '수정 중...' : '수정'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Dashboard 컴포넌트
const Dashboard = ({ 
  user = null, 
  userData = { name: '김대희', email: '' }, 
  selectedStore = 'store1', 
  stores = [], 
  onStoreChange = () => {}, 
  onAddStore = () => {}, 
  onEditStore = () => {},
  onTabChange = () => {}
}) => {
  const currentStore = stores.find(store => store.id === selectedStore) || stores[0] || { name: '인후네 마라탕', businessType: '중식', address: '서울특별시 강남구 테헤란로 129' }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">매출 관리 및 분석 현황을 확인하세요</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 매장 정보 섹션 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">매장 정보</h2>
              </div>
              <Button
                onClick={onEditStore}
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                수정
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {currentStore ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">대표자</span>
                    <span className="font-medium text-gray-900">{userData?.name || '김대희'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">선택된 매장</span>
                    <span className="font-medium text-blue-600">{currentStore.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">업종</span>
                    <span className="font-medium text-gray-900">{currentStore.businessType}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">주소</span>
                    <span className="font-medium text-gray-900 text-right max-w-xs truncate">{currentStore.address}</span>
                  </div>
                </div>
                
                {/* 매장 선택 드롭다운 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">매장 선택</label>
                  <select
                    key={`store-select-${stores.length}`}
                    value={selectedStore || (stores.length > 0 ? stores[0].id : '')}
                    onChange={(e) => onStoreChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.businessType})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 매장 추가 버튼 */}
                <Button
                  onClick={onAddStore}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Store className="w-4 h-4 mr-2" />
                  새 매장 추가
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  총 {stores.length}개 매장 등록됨
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">매장 정보를 불러오는 중...</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 시작하기 섹션 */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">시작하기</h2>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div 
                className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                onClick={() => onTabChange('input')}
              >
                <DollarSign className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">매출 입력</h4>
                  <p className="text-sm text-gray-600 mt-1">일별 매출을 간편하게 입력하세요</p>
                </div>
              </div>
              <div 
                className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                onClick={() => onTabChange('report')}
              >
                <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">매출 리포트</h4>
                  <p className="text-sm text-gray-600 mt-1">매출 현황과 통계를 확인하세요</p>
                </div>
              </div>
              <div 
                className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                onClick={() => onTabChange('comparison')}
              >
                <PieChart className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">매출 비교</h4>
                  <p className="text-sm text-gray-600 mt-1">다른 지역과 매출을 비교해보세요</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// SalesInput 컴포넌트
const SalesInput = ({ user = null, onSalesDataChange = () => {}, selectedStore = 'store1' }) => {
  // 로컬 시간대 기준으로 오늘 날짜 설정
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const todayDate = getTodayDateString()
  const [date, setDate] = useState(todayDate)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setMessage('올바른 매출 금액을 입력해주세요.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (!user) {
      setMessage('로그인이 필요합니다.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    debugLog('매출 저장 시작 (API)', { date, amount: parseFloat(amount), userId: user.id })
    
    try {
      // 현재 선택된 매장 정보 가져오기
      const currentStore = user.stores.find(store => store.id === selectedStore)
      const storeName = currentStore ? currentStore.name : '기본 매장'
      const businessType = currentStore ? currentStore.businessType : '기본 업종'
      
      // API로 매출 저장 시도
      const apiResult = await addSaleToAPI(user.id, selectedStore, date, parseFloat(amount), storeName, businessType)
      
      if (apiResult.success) {
        debugLog('API 매출 저장 성공', apiResult.data)
        setMessage('매출 데이터가 성공적으로 저장되었습니다.')
      } else {
        debugLog('API 매출 저장 실패, localStorage 백업 사용', apiResult.error)
        // API 실패 시 localStorage 백업
        addSaleToStorage(user.id, selectedStore, date, parseFloat(amount))
        setMessage('매출 데이터가 저장되었습니다. (오프라인 모드)')
      }
      
      setAmount('')
      
      // 즉시 새로고침 신호 전송
      setTimeout(() => {
        debugLog('매출 데이터 변경 신호 전송')
        if (onSalesDataChange) {
          onSalesDataChange()
        }
      }, 100)
      
    } catch (error) {
      debugLog('매출 저장 오류', { error: error.message, stack: error.stack })
      setMessage('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">매출 데이터 입력</h1>
        <p className="text-gray-600">일별 매출 정보를 간편하게 입력하고 관리하세요</p>
      </div>
      
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-lg font-medium">매출 입력</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">날짜와 매출액을 입력해주세요</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {message && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  message.includes('성공') 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      message.includes('성공') ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    {message}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 flex items-center justify-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      날짜
                    </label>
                    <input
                      key="sales-date-input"
                      type="date"
                      value={date || todayDate}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center bg-white text-gray-900"
                      required
                      max={todayDate}
                    />
                    <p className="text-xs text-gray-500 text-center">
                      선택된 날짜: {(() => {
                        const [year, month, day] = date.split('-').map(Number)
                        return new Date(year, month - 1, day).toLocaleDateString('ko-KR')
                      })()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                      매출액 (원)
                    </label>
                    <input
                      key="sales-amount-input"
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="예: 1500000"
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center bg-white text-gray-900 placeholder-gray-500"
                      required
                    />
                    {amount && parseFloat(amount) > 0 && (
                      <p className="text-sm text-blue-600 font-medium text-center">
                        {new Intl.NumberFormat('ko-KR').format(parseFloat(amount))}원
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        저장 중...
                      </div>
                    ) : (
                      '저장하기'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// SalesReport 컴포넌트
const SalesReport = ({ user = null, selectedStore = 'store1', salesRefreshTrigger = 0, stores = [] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [salesData, setSalesData] = useState([])
  const [todaySales, setTodaySales] = useState(0)
  const [yesterdaySales, setYesterdaySales] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [averageDailySales, setAverageDailySales] = useState(0)
  
  const currentStore = stores.find(store => store.id === selectedStore) || { name: '인후네 마라탕' }

  // 날짜 포맷팅 함수 (로컬 시간대 기준)
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 매출 데이터 로드 (API 버전)
  useEffect(() => {
    const loadSalesData = async () => {
      if (user) {
        const userId = user.id
        debugLog('매출 데이터 로드 시작', { userId, selectedStore })
        
        // API에서 데이터 조회, 실패 시 localStorage 백업
        let data = await getSalesFromAPI(userId, selectedStore)
        if (data.length === 0) {
          debugLog('API 데이터가 없어서 localStorage 백업 사용')
          data = getSalesFromStorage(userId, selectedStore)
        }
        
        setSalesData(data)
        
        // 선택된 날짜의 매출
        const selectedDateStr = formatDate(selectedDate)
        const todayData = data.find(sale => sale.date === selectedDateStr)
        setTodaySales(todayData ? todayData.amount : 0)
        
        // 전일 매출
        const yesterday = new Date(selectedDate)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = formatDate(yesterday)
        const yesterdayData = data.find(sale => sale.date === yesterdayStr)
        setYesterdaySales(yesterdayData ? yesterdayData.amount : 0)
        
        // 전체 매출 총합
        const total = data.reduce((sum, sale) => sum + sale.amount, 0)
        setTotalSales(total)
        
        // 평균 일매출 계산
        const average = data.length > 0 ? total / data.length : 0
        setAverageDailySales(average)
        
        debugLog('매출 데이터 로드 완료', { dataCount: data.length, total, average })
      }
    }
    
    loadSalesData()
  }, [user, selectedDate, currentMonth, salesRefreshTrigger, selectedStore])

  // 달력 생성
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const dateStr = formatDate(current)
      const saleData = salesData.find(sale => sale.date === dateStr)
      const isCurrentMonth = current.getMonth() === month
      const isSelected = formatDate(current) === formatDate(selectedDate)
      const isToday = formatDate(current) === formatDate(new Date())

      days.push({
        date: new Date(current),
        dateStr,
        day: current.getDate(),
        isCurrentMonth,
        isSelected,
        isToday,
        hasSales: !!saleData,
        amount: saleData ? saleData.amount : 0
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // 증감률 계산
  const getChangeRate = () => {
    if (yesterdaySales === 0) return todaySales > 0 ? 100 : 0
    return ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1)
  }

  const changeRate = getChangeRate()
  const isPositive = changeRate >= 0

  // 월 이동
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // 인사이트 분석
  const getInsights = () => {
    const insights = []
    
    // 최근 7일 매출 분석
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = formatDate(date)
      const dayData = salesData.find(sale => sale.date === dateStr)
      last7Days.push(dayData ? dayData.amount : 0)
    }
    
    const weeklyAvg = last7Days.reduce((sum, amount) => sum + amount, 0) / 7
    const weeklyTotal = last7Days.reduce((sum, amount) => sum + amount, 0)
    
    // 요일별 매출 패턴 분석
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0] // 일~토
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
    
    salesData.forEach(sale => {
      const date = new Date(sale.date)
      const dayOfWeek = date.getDay()
      weekdayTotals[dayOfWeek] += sale.amount
      weekdayCounts[dayOfWeek]++
    })
    
    const weekdayAvgs = weekdayTotals.map((total, index) => 
      weekdayCounts[index] > 0 ? total / weekdayCounts[index] : 0
    )
    
    const bestDay = weekdayAvgs.indexOf(Math.max(...weekdayAvgs))
    const worstDay = weekdayAvgs.indexOf(Math.min(...weekdayAvgs.filter(avg => avg > 0)))
    
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

    if (weeklyTotal > 0) {
      if (todaySales > weeklyAvg * 1.2) {
        insights.push({
          type: 'positive',
          title: '좋은 매출 성과!',
          description: `오늘 매출이 주간 평균보다 ${((todaySales / weeklyAvg - 1) * 100).toFixed(0)}% 높습니다.`,
          icon: Target
        })
      } else if (todaySales < weeklyAvg * 0.8) {
        insights.push({
          type: 'warning',
          title: '매출 개선 필요',
          description: `오늘 매출이 주간 평균보다 ${((1 - todaySales / weeklyAvg) * 100).toFixed(0)}% 낮습니다.`,
          icon: AlertTriangle
        })
      }

      if (bestDay !== -1 && weekdayAvgs[bestDay] > 0) {
        insights.push({
          type: 'info',
          title: '최고 매출 요일',
          description: `${dayNames[bestDay]}이 평균적으로 가장 좋은 매출을 보입니다. (평균 ${weekdayAvgs[bestDay].toLocaleString()}원)`,
          icon: Lightbulb
        })
      }

             // 월 목표 달성률 (평균 기반)
       if (averageDailySales > 0) {
         const monthlyGoal = averageDailySales * 30 // 평균 기반 월 목표
         const currentMonthStr = currentMonth.getFullYear() + '-' + String(currentMonth.getMonth() + 1).padStart(2, '0')
         const monthData = salesData.filter(sale => sale.date.startsWith(currentMonthStr))
         const monthlyTotal = monthData.reduce((sum, sale) => sum + sale.amount, 0)
         const achievementRate = (monthlyTotal / monthlyGoal * 100).toFixed(1)
         
         if (achievementRate > 80) {
           insights.push({
             type: 'positive',
             title: '월 목표 달성 중',
             description: `이번 달 예상 목표의 ${achievementRate}%를 달성했습니다.`,
             icon: Target
           })
         }
       }
    }

    return insights.length > 0 ? insights : [{
      type: 'info',
      title: '데이터 수집 중',
      description: '더 정확한 분석을 위해 매출 데이터를 꾸준히 입력해주세요.',
      icon: BarChart3
    }]
  }

  const insights = getInsights()

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
                 <div>
           <h1 className="text-3xl font-semibold text-gray-900 mb-2">매출 리포트</h1>
           <p className="text-gray-600">{currentStore.name} 매출 현황을 확인하세요</p>
         </div>
        <Button variant="outline" className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>새로고침</span>
        </Button>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 통계 카드들 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 총 매출액 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                                 <div>
                   <p className="text-sm text-gray-600">총 매출액</p>
                   <p className="text-2xl font-bold text-gray-900">{totalSales.toLocaleString()}원</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* 평균 일매출 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                                 <div>
                   <p className="text-sm text-gray-600">평균 일매출</p>
                   <p className="text-2xl font-bold text-gray-900">{Math.round(averageDailySales).toLocaleString()}원</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* 기록된 일수 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">기록된 일수</p>
                  <p className="text-2xl font-bold text-gray-900">{salesData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 달력 */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendar().map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.date)}
                  className={`
                    relative p-2 text-sm rounded-lg transition-colors
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isSelected ? 'bg-gray-900 text-white' : ''}
                    ${day.isToday && !day.isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : ''}
                    ${day.hasSales && !day.isSelected ? 'bg-green-50' : ''}
                    hover:bg-gray-100
                  `}
                >
                  {day.day}
                  {day.hasSales && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              * 한원 장: 매출 기록이 있는 날짜
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 선택된 날짜 상세 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">당일 매출</span>
                <span className="text-2xl font-bold text-gray-900">{todaySales.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">전일 대비</span>
                <div className="flex items-center space-x-2">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(changeRate)}%
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                매출 입력 메뉴에서 데이터를 추가하세요.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">매출 인사이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    insight.type === 'positive' ? 'bg-green-100' : 
                    insight.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <insight.icon className={`w-4 h-4 ${
                      insight.type === 'positive' ? 'text-green-600' : 
                      insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  )
}

// SalesComparison 컴포넌트  
const SalesComparison = ({ user = null, selectedStore = 'store1', stores = [], salesRefreshTrigger = 0 }) => {
  // 현재 매장 정보 계산
  const comparisonStore = stores.find(store => store.id === selectedStore) || { name: '인후네 마라탕', businessType: '중식', address: '서울특별시 강남구 테헤란로 129' }
  
  // hydration 안전성을 위해 기본값을 명시적으로 설정
  const [selectedDistricts, setSelectedDistricts] = useState([])
  const [selectedBusinessType, setSelectedBusinessType] = useState('중식') // 고정된 기본값
  const [salesData, setSalesData] = useState([])
  const [myAverageDailySales, setMyAverageDailySales] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 서울시 25개 구 기본 매출 배율
  const seoulDistricts = [
    { name: '강남구', multiplier: 1.15 },
    { name: '강동구', multiplier: 0.95 },
    { name: '강북구', multiplier: 0.88 },
    { name: '강서구', multiplier: 1.02 },
    { name: '관악구', multiplier: 0.92 },
    { name: '광진구', multiplier: 0.98 },
    { name: '구로구', multiplier: 0.94 },
    { name: '금천구', multiplier: 0.89 },
    { name: '노원구', multiplier: 0.91 },
    { name: '도봉구', multiplier: 0.86 },
    { name: '동대문구', multiplier: 0.93 },
    { name: '동작구', multiplier: 0.97 },
    { name: '마포구', multiplier: 1.08 },
    { name: '서대문구', multiplier: 1.01 },
    { name: '서초구', multiplier: 1.25 },
    { name: '성동구', multiplier: 0.96 },
    { name: '성북구', multiplier: 0.95 },
    { name: '송파구', multiplier: 1.12 },
    { name: '양천구', multiplier: 0.98 },
    { name: '영등포구', multiplier: 1.05 },
    { name: '용산구', multiplier: 1.07 },
    { name: '은평구', multiplier: 0.90 },
    { name: '종로구', multiplier: 1.04 },
    { name: '중구', multiplier: 1.06 },
    { name: '중랑구', multiplier: 0.87 }
  ]

  // 업종별 기본 평균 매출 (90만원~130만원 범위)
  const businessTypes = [
    { name: '중식', baseSales: 1050000 },
    { name: '한식', baseSales: 980000 },
    { name: '일식', baseSales: 1180000 },
    { name: '양식', baseSales: 1280000 },
    { name: '치킨', baseSales: 920000 },
    { name: '피자', baseSales: 1100000 },
    { name: '카페', baseSales: 900000 },
    { name: '분식', baseSales: 950000 }
  ]

  // 지역별 업종별 매출 계산 함수
  const calculateSalesByDistrictAndType = (districtName, businessType) => {
    const district = seoulDistricts.find(d => d.name === districtName)
    const business = businessTypes.find(bt => bt.name === businessType)
    
    if (!district || !business) return 1000000 // 기본값
    
    return Math.round(business.baseSales * district.multiplier)
  }

  // 매장 주소에서 행정구역 추출
  const extractDistrictFromAddress = (address) => {
    const districts = seoulDistricts.map(d => d.name)
    return districts.find(district => address.includes(district)) || null
  }

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 마운트 후 안전한 초기화
  useEffect(() => {
    if (isMounted && !isInitialized && comparisonStore) {
      // 매장 정보 기반 초기화
      setSelectedBusinessType(comparisonStore.businessType || '중식')
      
      // 주소 기반 지역 선택
      if (comparisonStore.address) {
        const district = extractDistrictFromAddress(comparisonStore.address)
        if (district) {
          const districtObj = seoulDistricts.find(d => d.name === district)
          if (districtObj) {
            setSelectedDistricts([{ 
              name: districtObj.name, 
              averageSales: calculateSalesByDistrictAndType(districtObj.name, selectedBusinessType)
            }])
          }
        }
      }
      
      setIsInitialized(true)
    }
  }, [isMounted, isInitialized, comparisonStore])

  // 내 매출 데이터 로드 (API 버전)
  useEffect(() => {
    const loadMyAverageSales = async () => {
      if (user) {
        const userId = user.id
        debugLog('내 매출 데이터 로드 시작 (비교용)', { userId, selectedStore })
        
        // API에서 데이터 조회, 실패 시 localStorage 백업
        let data = await getSalesFromAPI(userId, selectedStore)
        if (data.length === 0) {
          debugLog('API 데이터가 없어서 localStorage 백업 사용 (비교용)')
          data = getSalesFromStorage(userId, selectedStore)
        }
        
        setSalesData(data)
        
        // 내 평균 일매출 계산
        const total = data.reduce((sum, sale) => sum + sale.amount, 0)
        const average = data.length > 0 ? total / data.length : 0
        setMyAverageDailySales(average)
        
        debugLog('내 매출 데이터 로드 완료 (비교용)', { dataCount: data.length, total, average })
      }
    }
    
    loadMyAverageSales()
  }, [user, salesRefreshTrigger, selectedStore])

  // 업종 변경 시 선택된 지역들의 매출 재계산
  useEffect(() => {
    if (selectedBusinessType && selectedDistricts.length > 0) {
      setSelectedDistricts(prev => 
        prev.map(district => ({
          name: district.name,
          averageSales: calculateSalesByDistrictAndType(district.name, selectedBusinessType)
        }))
      )
    }
  }, [selectedBusinessType])

  // 지역 선택/해제
  const toggleDistrict = (district) => {
    setSelectedDistricts(prev => {
      if (prev.find(d => d.name === district.name)) {
        // 이미 선택된 지역이면 제거
        return prev.filter(d => d.name !== district.name)
      } else if (prev.length < 3) {
        // 최대 3개까지만 선택 가능 - 업종별 매출 계산
        const districtWithSales = {
          name: district.name,
          averageSales: calculateSalesByDistrictAndType(district.name, selectedBusinessType)
        }
        return [...prev, districtWithSales]
      }
      return prev
    })
  }

  // 비교 차트 데이터 생성
  const getChartData = () => {
    const chartData = [
      {
        name: `내 가게 (${comparisonStore.name})`,
        sales: Math.round(myAverageDailySales),
        color: '#EF4444', // 빨간색
        isMyStore: true
      }
    ]

    // 선택된 지역들 추가
    selectedDistricts.forEach((district, index) => {
      chartData.push({
        name: district.name,
        sales: district.averageSales,
        color: '#E5E7EB', // 회색
        isMyStore: false
      })
    })

    // 선택된 업종 추가 (내 업종이 아닌 경우만)
    if (selectedBusinessType && selectedBusinessType !== comparisonStore.businessType) {
      const businessTypeObj = businessTypes.find(bt => bt.name === selectedBusinessType)
      if (businessTypeObj) {
        chartData.push({
          name: `${selectedBusinessType} 업종 평균`,
          sales: businessTypeObj.baseSales,
          color: '#D1D5DB', // 더 옅은 회색
          isMyStore: false
        })
      }
    }

    return chartData
  }

  const chartData = getChartData()
  const maxSales = Math.max(...chartData.map(d => d.sales))

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">매출 비교</h1>
        <p className="text-gray-600">{comparisonStore.name}과 서울 지역 매출을 비교하여 인사이트를 얻으세요</p>
      </div>

      {/* 비교 조건 선택 카드 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">비교 조건 선택</CardTitle>
          <p className="text-sm text-gray-600">지역과 업종을 선택하여 매출을 비교해보세요.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 업종 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">업종 선택</label>
              <ClientOnly fallback={<div className="h-10 animate-pulse bg-gray-100 rounded-lg"></div>}>
                <select
                  key="business-type-select"
                  value={selectedBusinessType || '중식'}
                  onChange={(e) => setSelectedBusinessType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 text-sm"
                >
                  {businessTypes.map(businessType => (
                    <option key={businessType.name} value={businessType.name}>
                      {businessType.name}
                      {businessType.name === comparisonStore.businessType ? ' (내 업종)' : ''}
                    </option>
                  ))}
                </select>
              </ClientOnly>
            </div>

            {/* 지역 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">지역 추가 (최대 3개)</label>
              <ClientOnly fallback={<div className="h-10 animate-pulse bg-gray-100 rounded-lg"></div>}>
                <select
                  key="district-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const district = seoulDistricts.find(d => d.name === e.target.value)
                      if (district) {
                        toggleDistrict(district)
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 text-sm"
                  disabled={selectedDistricts.length >= 3}
                >
                  <option value="">지역을 선택하세요...</option>
                  {seoulDistricts
                    .filter(district => !selectedDistricts.find(d => d.name === district.name))
                    .map(district => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                </select>
              </ClientOnly>
            </div>
          </div>

          {/* 선택된 지역들 표시 */}
          {selectedDistricts.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <label className="text-sm font-medium text-gray-700 mb-2 block">선택된 지역 ({selectedDistricts.length}/3)</label>
              <div className="flex flex-wrap gap-2">
                {selectedDistricts.map(district => (
                  <div
                    key={district.name}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm"
                  >
                    <span className="font-medium text-blue-700">{district.name}</span>
                    <button
                      onClick={() => toggleDistrict(district)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일평균 매출 비교 카드 */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">일평균 매출 비교</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 비교 요약 메시지 */}
          {(selectedDistricts.length > 0 || (selectedBusinessType && selectedBusinessType !== comparisonStore.businessType)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-blue-900">📊 매출 비교 결과</h3>
                
                {selectedDistricts.length > 0 && (() => {
                  const avgRegionSales = selectedDistricts.reduce((sum, d) => sum + d.averageSales, 0) / selectedDistricts.length
                  const diff = myAverageDailySales - avgRegionSales
                  const percentage = avgRegionSales > 0 ? Math.abs((diff / avgRegionSales) * 100) : 0
                  
                  return (
                    <p className={`text-sm font-medium ${diff >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      선택한 지역 대비 내 가게 매출이 {percentage.toFixed(1)}% {diff >= 0 ? '높습니다' : '낮습니다'} ✓
                    </p>
                  )
                })()}
                
                {selectedBusinessType && selectedBusinessType !== comparisonStore.businessType && (() => {
                  const businessTypeObj = businessTypes.find(bt => bt.name === selectedBusinessType)
                  if (businessTypeObj) {
                    const diff = myAverageDailySales - businessTypeObj.averageSales
                    const percentage = businessTypeObj.averageSales > 0 ? Math.abs((diff / businessTypeObj.averageSales) * 100) : 0
                    
                    return (
                      <p className={`text-sm font-medium ${diff >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedBusinessType} 업종 대비 내 가게 매출이 {percentage.toFixed(1)}% {diff >= 0 ? '높습니다' : '낮습니다'} ✓
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          )}

          {/* 차트 */}
          {chartData.length > 1 ? (
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${item.isMyStore ? 'text-red-600' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {item.sales.toLocaleString()}원
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(item.sales / maxSales) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">
                <BarChart3 className="w-10 h-10 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">비교할 지역을 선택해주세요</p>
              <p className="text-sm text-gray-500 mt-1">최대 3개 지역까지 선택 가능합니다</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// 메인 App 컴포넌트
export default function Home() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState({
    name: '김대희',
    email: ''
  })
  const [stores, setStores] = useState([
    {
      id: 'store1',
      name: '인후네 마라탕',
      businessType: '중식',
      address: '서울특별시 강남구 테헤란로 129'
    }
  ])
  const [selectedStore, setSelectedStore] = useState('store1')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [salesRefreshTrigger, setSalesRefreshTrigger] = useState(0)
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false)
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false)

  const handleSalesDataChange = () => {
    const newTrigger = salesRefreshTrigger + 1
    debugLog('매출 데이터 변경 핸들러 호출', { oldTrigger: salesRefreshTrigger, newTrigger })
    setSalesRefreshTrigger(newTrigger)
  }

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue)
  }

  const handleStoreChange = (storeId) => {
    setSelectedStore(storeId)
    debugLog('매장 변경', { storeId })
    // 매장 변경 시 매출 데이터 새로고침
    handleSalesDataChange()
  }

  const handleAddStore = (storeData) => {
    const newStore = {
      id: 'store' + (stores.length + 1),
      name: storeData.name,
      businessType: storeData.businessType,
      address: storeData.address
    }

    setStores(prev => [...prev, newStore])
    setSelectedStore(newStore.id)
    debugLog('새 매장 추가', newStore)
  }

  const handleOpenAddStoreModal = () => {
    setIsAddStoreModalOpen(true)
  }

  const handleCloseAddStoreModal = () => {
    setIsAddStoreModalOpen(false)
  }

  const handleEditStore = (storeData) => {
    const currentStore = stores.find(store => store.id === selectedStore)
    if (!currentStore) return

    const updatedStore = {
      ...currentStore,
      name: storeData.name,
      businessType: storeData.businessType,
      address: storeData.address
    }

    setStores(prev => prev.map(store => store.id === selectedStore ? updatedStore : store))
    debugLog('매장 정보 수정', updatedStore)
  }

  const handleOpenEditStoreModal = () => {
    setIsEditStoreModalOpen(true)
  }

  const handleCloseEditStoreModal = () => {
    setIsEditStoreModalOpen(false)
  }

  const handleLogin = async (email, password) => {
    try {
      debugLog('로그인 시도', email)
      setLoading(true)
      
      // 백엔드 서버 연결 확인
      const isBackendOnline = await healthCheck()
      if (!isBackendOnline) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
      }

      // 실제 사용자 정보에서 찾기
      const realUser = Object.values(realUserInfo).find(user => user.email === email)
      
      if (!realUser) {
        throw new Error('등록되지 않은 사용자입니다. 사용 가능한 계정: rlaeogml0724@naver.com, rladlsgy@naver.com, dbswldnjs@naver.com, wjdtndud@naver.com')
      }

      // 비밀번호 검증 (데모용)
      if (password !== 'password123') {
        throw new Error('비밀번호가 일치하지 않습니다. (데모용 비밀번호: password123)')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        id: realUser.id,
        email: realUser.email,
        name: realUser.name,
        stores: realUser.stores
      }
      
      setUser(userData)
      setStores(realUser.stores)
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      debugLog('로그인 성공', userData)
      return { success: true }
    } catch (error) {
      debugLog('로그인 처리 오류', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (signupData) => {
    try {
      debugLog('회원가입 시도', signupData.email)
      setLoading(true)
      
      // 실제 Supabase 연동 없이 데모용 회원가입
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 사용자 데이터 업데이트
      setUserData({
        name: signupData.name,
        email: signupData.email
      })

      // 첫 번째 매장 추가
      const firstStore = {
        id: 'store1',
        name: signupData.storeName,
        businessType: signupData.businessType,
        address: signupData.address
      }
      setStores([firstStore])
      setSelectedStore('store1')
      
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email: signupData.email
      }
      
      setUser(mockUser)
      debugLog('회원가입 성공', mockUser.email)
      return { success: true }
    } catch (error) {
      debugLog('회원가입 처리 오류', error)
      return { success: false, error: '회원가입 처리 중 오류가 발생했습니다: ' + error.message }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setUser(null)
      setUserData(null)
      setActiveTab('dashboard')
      setSalesRefreshTrigger(0)
      debugLog('로그아웃 완료')
    } catch (error) {
      debugLog('로그아웃 오류', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-6 shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">사장EZ</h1>
            <p className="text-lg text-gray-700 mb-2">소상공인을 위한 매출 관리 플랫폼</p>
            <p className="text-sm text-gray-600">전국 모든 가게의 경쟁력을 높이는 일상 파트너</p>
          </div>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-8">
              <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
                <Button
                  variant="ghost"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 rounded-lg font-medium transition-all ${
                    isLogin 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  로그인
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 rounded-lg font-medium transition-all ${
                    !isLogin 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  회원가입
                </Button>
              </div>
              
              {isLogin ? (
                <div>
                  <LoginForm key="login-form" onLogin={handleLogin} />
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>처음 방문하시나요?</strong><br />
                      위의 "회원가입" 탭을 클릭하여 계정을 생성해주세요.
                    </p>
                  </div>
                </div>
              ) : (
                                  <SignupForm key="signup-form" onSignup={handleSignup} onSwitchToLogin={() => setIsLogin(true)} />
              )}
            </CardContent>
          </Card>

          <div className="text-center text-xs text-gray-500">
            <p>© 2024 사장EZ. 소상공인의 성공을 응원합니다.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">사장EZ</h1>
              </div>
              {userData && (
                <div className="ml-8 hidden sm:block">
                  <span className="text-gray-600">안녕하세요, </span>
                  <span className="font-semibold text-gray-900">{userData.name}</span>
                  <span className="text-gray-600">님</span>
                  <div className="text-sm text-gray-500">{stores.find(s => s.id === selectedStore)?.name || '매장 선택'}</div>
                </div>
              )}
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="font-medium">
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab || 'dashboard'} onValueChange={setActiveTab}>
          <div className="mb-8">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-white p-1 shadow-sm border border-gray-200">
              <TabsTrigger value="dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all text-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow">
                <Building2 className="w-4 h-4 mr-2" />
                대시보드
              </TabsTrigger>
              <TabsTrigger value="input" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all text-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow">
                <DollarSign className="w-4 h-4 mr-2" />
                매출 입력
              </TabsTrigger>
              <TabsTrigger value="report" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all text-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow">
                <BarChart3 className="w-4 h-4 mr-2" />
                매출 리포트
              </TabsTrigger>
              <TabsTrigger value="comparison" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all text-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow">
                <TrendingUp className="w-4 h-4 mr-2" />
                매출 비교
              </TabsTrigger>

            </TabsList>
          </div>
          
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard 
              user={user} 
              userData={userData} 
              selectedStore={selectedStore}
              stores={stores}
              onStoreChange={handleStoreChange}
              onAddStore={handleOpenAddStoreModal}
              onEditStore={handleOpenEditStoreModal}
              onTabChange={handleTabChange}
            />
          </TabsContent>
          
          <TabsContent value="input" className="mt-0">
            <ClientOnly fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg"></div>}>
              <SalesInput user={user} onSalesDataChange={handleSalesDataChange} selectedStore={selectedStore} />
            </ClientOnly>
          </TabsContent>
          
          <TabsContent value="report" className="mt-0">
            <ClientOnly fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg"></div>}>
              <SalesReport user={user} selectedStore={selectedStore} salesRefreshTrigger={salesRefreshTrigger} stores={stores} />
            </ClientOnly>
          </TabsContent>
          
          <TabsContent value="comparison" className="mt-0">
            <ClientOnly fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg"></div>}>
              <SalesComparison user={user} selectedStore={selectedStore} stores={stores} salesRefreshTrigger={salesRefreshTrigger} />
            </ClientOnly>
          </TabsContent>
          

        </Tabs>
      </main>
      
      {/* 매장 추가 모달 */}
      <AddStoreModal 
        isOpen={isAddStoreModalOpen}
        onClose={handleCloseAddStoreModal}
        onAddStore={handleAddStore}
      />
      
      {/* 매장 수정 모달 */}
      <EditStoreModal 
        isOpen={isEditStoreModalOpen}
        onClose={handleCloseEditStoreModal}
        onEditStore={handleEditStore}
        currentStore={stores.find(store => store.id === selectedStore)}
      />
    </div>
  )
}
