import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2Icon, XCircleIcon, Loader2Icon } from 'lucide-react'
import { API_CONFIG } from '../../config/api'
import axios from 'axios'

export const TaskCompletedPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [plantBoxName, setPlantBoxName] = useState<string>('')
  const [actionDescription, setActionDescription] = useState<string>('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Token không hợp lệ')
      return
    }

    // Call API to complete task
    const completeTask = async () => {
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLANT_BOXES.COMPLETE_TASK}`, {
          params: { token },
          timeout: 10000,
        })

        if (response.data.success) {
          setStatus('success')
          setMessage(response.data.message || 'Đã đánh dấu hoàn thành công việc!')
          if (response.data.data?.plantBox) {
            setPlantBoxName(response.data.data.plantBox.name || '')
          }
          if (response.data.data?.action) {
            setActionDescription(response.data.data.action.description || '')
          }
        } else {
          setStatus('error')
          setMessage(response.data.message || 'Không thể hoàn thành công việc')
        }
      } catch (error: any) {
        console.error('Error completing task:', error)
        setStatus('error')
        if (error.response?.data?.message) {
          setMessage(error.response.data.message)
        } else if (error.message) {
          setMessage(error.message)
        } else {
          setMessage('Đã xảy ra lỗi khi hoàn thành công việc')
        }
      }
    }

    completeTask()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2Icon className="animate-spin text-green-600 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang xử lý...</h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2Icon className="text-green-600 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">✅ Hoàn thành!</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            {plantBoxName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">📦 {plantBoxName}</p>
                {actionDescription && (
                  <p className="text-sm font-medium text-gray-900">{actionDescription}</p>
                )}
              </div>
            )}
            <button
              onClick={() => navigate('/my-plants')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Quay về trang của tôi
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="text-red-600 mx-auto mb-4" size={64} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">❌ Lỗi</h1>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => navigate('/my-plants')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Quay về trang của tôi
            </button>
          </>
        )}
      </div>
    </div>
  )
}

