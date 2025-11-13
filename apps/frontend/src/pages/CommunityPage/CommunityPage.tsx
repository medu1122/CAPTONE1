import React, { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { PostCard } from './components/PostCard'
import { PostFilters } from './components/PostFilters'
import { CreatePostModal } from './components/CreatePostModal'
import { usePosts } from './hooks/usePost'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingStates'
import { UserMenu } from '../../components/UserMenu'

export const CommunityPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const {
    posts,
    loading,
    error,
    filters,
    pagination,
    createPost,
    likePost,
    updateFilters,
  } = usePosts()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCreatePost = async (data: any) => {
    await createPost(data)
    setIsCreateModalOpen(false)
  }

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      // Redirect to login hoặc show toast
      return
    }
    await likePost(postId)
  }

  const handleComment = (_postId: string) => {
    // Refresh posts to get latest comments
    // This is handled by PostCard component which calls fetchPosts after creating comment
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/src/assets/icons/iconHeader_GreenGrow.png"
                alt="GreenGrow Logo"
                className="h-8 w-auto"
              />
              <span className="font-bold text-green-600 text-xl">
                GreenGrow
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="/community"
                className="text-green-600 font-medium border-b-2 border-green-600 pb-1"
              >
                Cộng đồng
              </a>
              <a
                href="/chat"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Chat AI
              </a>
              <a
                href="/home"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Trang chủ
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="/auth"
                    className="text-gray-700 hover:text-green-600 transition-colors"
                  >
                    Đăng nhập
                  </a>
                  <a
                    href="/auth"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Đăng ký
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cộng đồng</h1>
            <p className="text-gray-600">
              Chia sẻ kinh nghiệm và học hỏi từ cộng đồng nông dân
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon size={20} />
              <span>Tạo bài viết</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <PostFilters filters={filters} onFilterChange={updateFilters} />
            
            {/* Mobile Create Button */}
            {isAuthenticated && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="md:hidden mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon size={20} />
                <span>Tạo bài viết</span>
              </button>
            )}
          </aside>

          {/* Posts List */}
          <div className="lg:col-span-3">
            {loading && posts.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    // Retry fetch
                    window.location.reload()
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-lg">
                  Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
                </p>
                {isAuthenticated && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Tạo bài viết đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                  />
                ))}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() =>
                        updateFilters({ page: Math.max(1, pagination.page - 1) })
                      }
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        updateFilters({
                          page: Math.min(
                            pagination.totalPages,
                            pagination.page + 1,
                          ),
                        })
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  )
}

