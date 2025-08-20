import React, { useState } from 'react'
import { Button } from './ui/button'

export const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setMessage('이메일과 비밀번호를 모두 입력해주세요.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    setMessage('')
    
    try {
      const result = await onLogin(email, password)
      if (!result.success) {
        setMessage(result.error || '로그인에 실패했습니다.')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('로그인 처리 중 오류가 발생했습니다.')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="p-4 rounded-lg border bg-red-50 text-red-800 border-red-200">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 rounded-full mr-3 bg-red-400"></div>
            {message}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">이메일</label>
        <input
          key="login-email"
          type="email"
          value={email || ''}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일을 입력하세요"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">비밀번호</label>
        <input
          key="login-password"
          type="password"
          value={password || ''}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
          required
        />
      </div>
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            로그인 중...
          </div>
        ) : (
          '로그인'
        )}
      </Button>
    </form>
  )
} 