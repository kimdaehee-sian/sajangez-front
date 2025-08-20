import React, { useState } from 'react'
import { Button } from './ui/button'

export const SignupForm = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    storeName: '',
    businessType: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 입력 검증
    if (!formData.name || !formData.storeName || !formData.email || !formData.password) {
      setMessage('필수 정보를 모두 입력해주세요.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (formData.password.length < 6) {
      setMessage('비밀번호는 6자 이상이어야 합니다.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const result = await onSignup(formData)
      if (!result.success) {
        setMessage(result.error || '회원가입에 실패했습니다.')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('회원가입 처리 중 오류가 발생했습니다.')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg border ${
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">대표자명 *</label>
                               <input
            key="signup-name"
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="홍길동"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">매장명 *</label>
                               <input
            key="signup-storename"
            type="text"
            name="storeName"
            value={formData.storeName || ''}
            onChange={handleChange}
            placeholder="홍길동 치킨"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">업종</label>
                     <input
             type="text"
             name="businessType"
             value={formData.businessType || ''}
             onChange={handleChange}
             placeholder="치킨전문점"
             className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
           />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">주소</label>
                     <input
             type="text"
             name="address"
             value={formData.address || ''}
             onChange={handleChange}
             placeholder="서울시 강남구..."
             className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
           />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">이메일 *</label>
                 <input
           type="email"
           name="email"
                       value={formData.email || ''}
           onChange={handleChange}
           placeholder="hong@example.com"
           className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
           required
         />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">비밀번호 *</label>
                     <input
             type="password"
             name="password"
             value={formData.password || ''}
             onChange={handleChange}
             placeholder="6자 이상"
             className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
             required
           />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">비밀번호 확인 *</label>
                     <input
             type="password"
             name="confirmPassword"
             value={formData.confirmPassword || ''}
             onChange={handleChange}
             placeholder="비밀번호 재입력"
             className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
             required
           />
        </div>
      </div>
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            가입 중...
          </div>
        ) : (
          '회원가입'
        )}
      </Button>
      
      <div className="text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          로그인하기
        </button>
      </div>
    </form>
  )
} 