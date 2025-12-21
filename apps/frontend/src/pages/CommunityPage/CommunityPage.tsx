import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlusIcon } from 'lucide-react'
import { PostCard } from './components/PostCard'
import { PostFilters } from './components/PostFilters'
import { CreatePostModal } from './components/CreatePostModal'
import { EditPostModal } from './components/EditPostModal'
import { usePosts } from './hooks/usePost'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common/LoadingStates'
import { UserMenu } from '../../components/UserMenu'
import { communityEvents } from '../../utils/communityEvents'
import type { Post, UpdatePostData } from './types/community.types'

export const CommunityPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const postIdFromUrl = searchParams.get('post')
  const commentIdFromUrl = searchParams.get('comment')
  const hasScrolledRef = useRef(false)
  
  const {
    posts,
    loading,
    error,
    filters,
    pagination,
    createPost,
    updatePost,
    deletePost,
    likePost,
    updateFilters,
    fetchPosts,
  } = usePosts()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

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

  const handleComment = async (postId: string) => {
    // Refresh posts to get latest comments including replies
    await fetchPosts()
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post)
  }

  const handleEditSubmit = async (id: string, data: UpdatePostData) => {
    await updatePost(id, data)
    setEditingPost(null)
    await fetchPosts() // Refresh to get updated post
  }

  const handleDelete = async (postId: string) => {
    const success = await deletePost(postId)
    if (success) {
      await fetchPosts() // Refresh to remove deleted post
    }
  }

  // Listen to real-time community events (instant refresh when notification received)
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🔔 [CommunityPage] Subscribing to community events');
    const unsubscribe = communityEvents.subscribe(() => {
      console.log('🔄 [CommunityPage] Community event received, refreshing posts');
      fetchPosts();
    });

    return () => {
      console.log('🔕 [CommunityPage] Unsubscribing from community events');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Auto-refresh posts every 30 seconds as fallback (for users without notifications)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      console.log('🔄 [CommunityPage] Periodic auto-refresh');
      fetchPosts();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Scroll to post when postId is in URL (e.g., from notification)
  useEffect(() => {
    if (postIdFromUrl && posts.length > 0 && !loading && !hasScrolledRef.current) {
      // Wait a bit for posts to render
      const timer = setTimeout(() => {
        const postElement = document.getElementById(`post-${postIdFromUrl}`)
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          postElement.classList.add('ring-2', 'ring-green-500', 'ring-offset-2')
          setTimeout(() => {
            postElement.classList.remove('ring-2', 'ring-green-500', 'ring-offset-2')
          }, 3000)
          
          // If there's a commentId, try to scroll to it after a delay
          if (commentIdFromUrl) {
            setTimeout(() => {
              const commentElement = document.getElementById(`comment-${commentIdFromUrl}`)
              if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                commentElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
                setTimeout(() => {
                  commentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
                }, 3000)
              }
            }, 500)
          }
          
          hasScrolledRef.current = true
          // Clean up URL params after scrolling
          setSearchParams({}, { replace: true })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [postIdFromUrl, commentIdFromUrl, posts, loading, setSearchParams])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 sticky top-0 z-50">
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
            <nav className="hidden md:flex items-center space-x-6">
              <a
                href="/analyze"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
              >
                <span className="text-lg">🔬</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Phân Tích</span>
                  <span className="text-xs text-gray-500 group-hover:text-green-600">Nhận diện & bệnh</span>
                </div>
              </a>
              <a
                href="/knowledge"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
              >
                <span className="text-lg">📚</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Kiến Thức</span>
                  <span className="text-xs text-gray-500 group-hover:text-green-600">Hỏi đáp AI</span>
                </div>
              </a>
              <a
                href="/community"
                className="flex items-center gap-2 text-green-600 font-medium border-b-2 border-green-600 pb-1 group"
              >
                <span className="text-lg">👥</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Cộng Đồng</span>
                  <span className="text-xs text-green-500">Chia sẻ kinh nghiệm</span>
                </div>
              </a>
              <a
                href="/my-plants"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
              >
                <span className="text-lg">🌿</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Vườn Của Tôi</span>
                  <span className="text-xs text-gray-500 group-hover:text-green-600">Quản lý cây trồng</span>
                </div>
              </a>
              <a
                href="/map"
                className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
              >
                <span className="text-lg">🗺️</span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Bản đồ Nông vụ</span>
                  <span className="text-xs text-gray-500 group-hover:text-green-600">Đất đai & cây trồng</span>
                </div>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cộng đồng</h1>
            <p className="text-gray-600 dark:text-gray-300">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 p-6">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 p-12 text-center">
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
                  <div key={post.id} id={`post-${post.id}`}>
                    <PostCard
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
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
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-200">
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

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSubmit={handleEditSubmit}
      />
    </div>
  )
}

