'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Users,
  MessageSquare, 
  ThumbsUp, 
  Send, 
  PlusCircle, 
  Filter, 
  BookOpen, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Reply,
  LayoutGrid,
  List
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  getMyEnrollments, 
  getCommunityPosts, 
  toggleCommunityPostLike, 
  addCommunityPostComment, 
  createCommunityPost,
  toggleCommunityCommentLike
} from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useProtectedPage } from '@/lib/use-protected-page';
import { Enrollment, CommunityPost, CommunityPostComment } from '@/types';
import { buildCareerTracks, type CareerTrack } from '@/lib/career-paths';

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return dateString;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function CourseForgeCommunity() {
  const { user } = useProtectedPage();
  const { addToast } = useToast();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMode, setFilterMode] = useState<'ALL' | 'MATCHED'>('ALL');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');

  // New Post Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', courseId: '', mediaUrl: '' });

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewStyle, setViewStyle] = useState<'card' | 'list'>('card');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStyleChange = (style: 'card' | 'list') => {
    if (style === viewStyle) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setViewStyle(style);
      setIsTransitioning(false);
    }, 200);
  };

  const renderMessageWithTags = (message: string) => {
    if (!message) return null;
    const parts = message.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-md inline-block">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Fetch posts & enrollments from backend
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyEnrollments().catch(() => []),
      getCommunityPosts().catch(() => [])
    ]).then(([enrollmentData, postsData]) => {
      setEnrollments(enrollmentData || []);
      setPosts(postsData || []);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // Enrolled course IDs list for matching
  const enrolledCourseIds = useMemo(() => {
    return new Set(enrollments.map(e => e.course.id));
  }, [enrollments]);

  // Filter posts list
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Course ID filter
      if (selectedCourseFilter !== 'all' && post.courseId !== selectedCourseFilter) {
        return false;
      }
      // "Matched Only" filter - checks if student is enrolled in the post's related course
      if (filterMode === 'MATCHED') {
        return post.courseId ? enrolledCourseIds.has(post.courseId) : false;
      }
      return true;
    });
  }, [posts, filterMode, selectedCourseFilter, enrolledCourseIds]);

  // Build Career Tracks / Communities using the shared lib
  const careerTracks = useMemo<CareerTrack[]>(() => buildCareerTracks(enrollments), [enrollments]);

  // Active track information based on filter
  const activeTrack = useMemo(() => {
    if (selectedCourseFilter === 'all') {
      // Merge all communities and roles from all enrolled paths
      return {
        communities: careerTracks.flatMap(t => t.communities).filter((v, i, a) => a.findIndex(t2 => t2.name === v.name) === i),
        roles: careerTracks.flatMap(t => t.roles).filter((v, i, a) => a.findIndex(t2 => t2.title === v.title) === i),
        keywords: careerTracks.map(t => t.keywords).join(' OR ')
      };
    }
    const track = careerTracks.find(t => t.courseId === selectedCourseFilter);
    return track ? {
      communities: track.communities,
      roles: track.roles,
      keywords: track.keywords
    } : null;
  }, [careerTracks, selectedCourseFilter]);

  // Create a new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) {
      addToast('Please fill out all fields.', 'error');
      return;
    }

    try {
      const createdPost = await createCommunityPost(
        newPost.title, 
        newPost.body, 
        newPost.courseId || undefined,
        newPost.mediaUrl || undefined
      );
      setPosts([createdPost, ...posts]);
      setNewPost({ title: '', body: '', courseId: '', mediaUrl: '' });
      setShowCreateModal(false);
      addToast('Your post has been published to the community!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to create post. Please try again.', 'error');
    }
  };

  // Like or unlike a post
  const handleLikePost = async (postId: string) => {
    try {
      const res = await toggleCommunityPostLike(postId);
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likedByCurrentUser: !post.likedByCurrentUser,
            likesCount: res.likesCount
          };
        }
        return post;
      }));
    } catch (err) {
      console.error(err);
      addToast('Failed to update like status.', 'error');
    }
  };

  // Like or unlike a comment reply
  const handleLikeComment = async (postId: string, commentId: string) => {
    try {
      const res = await toggleCommunityCommentLike(commentId);
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  likedByCurrentUser: !c.likedByCurrentUser,
                  likesCount: res.likesCount
                };
              }
              return c;
            })
          };
        }
        return post;
      }));
    } catch (err) {
      console.error(err);
      addToast('Failed to update comment like status.', 'error');
    }
  };

  // Post a comment
  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const createdComment = await addCommunityPostComment(postId, commentText);
      const mappedComment: CommunityPostComment = {
        id: createdComment.id,
        message: createdComment.message || createdComment.body || '',
        likesCount: createdComment.likesCount ?? 0,
        likedByCurrentUser: Boolean(createdComment.likedByCurrentUser),
        createdAt: createdComment.createdAt || 'Just now',
        author: {
          id: createdComment.author?.id || createdComment.user?.id || '',
          firstName: createdComment.author?.firstName || createdComment.user?.firstName || '',
          lastName: createdComment.author?.lastName || createdComment.user?.lastName || '',
          role: createdComment.author?.role || createdComment.user?.role || 'STUDENT',
          avatarUrl: createdComment.author?.avatarUrl || createdComment.user?.avatarUrl || null,
        }
      };

      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, mappedComment]
          };
        }
        return post;
      }));
      setCommentText('');
      addToast('Comment added.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to post comment.', 'error');
    }
  };

  return (
    <DashboardLayout role={user?.role === 'INSTRUCTOR' ? 'instructor' : 'student'}>
      <div className="space-y-8">
        
        {/* Header Block */}
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-sm md:p-8">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500 border border-brand-500/20">
                <Users className="w-3.5 h-3.5" /> Peer-to-Peer Hub
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-heading)] md:text-[2.6rem]">
                CourseForge Community
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-main)]/80">
                Ask questions, share advice, and communicate with instructors and classmates. Filter posts to match only people from the same certifications.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(var(--brand-500-rgb,59,130,246),0.25)] hover:bg-brand-600 transition-all hover:scale-[1.02] shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              Start a Discussion
            </button>
          </div>
        </section>

        {/* Filters and Search Bar */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-[var(--surface-card-soft)] p-5 rounded-[24px] border border-[var(--surface-border)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-[var(--surface-border)] p-1 bg-[var(--surface-card)]">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  filterMode === 'ALL' ? 'bg-brand-500 text-white shadow' : 'text-[var(--color-text-main)] hover:bg-[var(--surface-card-soft)]'
                }`}
              >
                All Discussions
              </button>
              <button
                onClick={() => setFilterMode('MATCHED')}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === 'MATCHED' ? 'bg-brand-500 text-white shadow' : 'text-[var(--color-text-main)] hover:bg-[var(--surface-card-soft)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                My Courses Only
              </button>
            </div>

            {/* Course Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-main)]/60">Topic:</span>
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-xs font-bold text-[var(--text-heading)] outline-none focus:border-brand-500"
              >
                <option value="all">All Courses / Categories</option>
                {enrollments.map(e => (
                  <option key={e.course.id} value={e.course.id}>{e.course.title}</option>
                ))}
              </select>
            </div>
          </div>

          {filterMode === 'MATCHED' && enrollments.length === 0 && (
            <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Not enrolled in any courses yet.
            </div>
          )}
        </section>

        {/* Centered Forum Layout */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Main Forum Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[var(--surface-border)] pb-4">
              <h2 className="text-xl font-extrabold text-[var(--text-heading)] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-500" />
                Peer Discussions
              </h2>
              
              {/* Layout view toggle with sliding pill style */}
              <div className="flex items-center gap-1 bg-[var(--surface-card-soft)] border border-[var(--surface-border)] p-1 rounded-2xl shadow-inner">
                <button
                  onClick={() => handleStyleChange('card')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    viewStyle === 'card' 
                      ? 'bg-brand-500 text-white shadow-sm scale-105' 
                      : 'text-[var(--color-text-main)]/60 hover:text-[var(--text-heading)] hover:bg-[var(--surface-card)]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Card View</span>
                </button>
                <button
                  onClick={() => handleStyleChange('list')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    viewStyle === 'list' 
                      ? 'bg-brand-500 text-white shadow-sm scale-105' 
                      : 'text-[var(--color-text-main)]/60 hover:text-[var(--text-heading)] hover:bg-[var(--surface-card)]'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>List View</span>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[32px] p-12 text-center shadow-inner">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4" />
                <p className="text-sm text-[var(--color-text-main)]/60">Loading community discussions...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[32px] p-12 text-center shadow-inner">
                <MessageSquare className="w-12 h-12 text-[var(--color-text-main)]/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[var(--text-heading)]">No conversations found</h3>
                <p className="text-sm text-[var(--color-text-main)]/60 mt-1 max-w-sm mx-auto">
                  No one has posted under this filter yet. Be the first to start a conversation!
                </p>
              </div>
            ) : (
              <div className={`transition-all duration-300 transform ${
                isTransitioning ? 'opacity-40 scale-[0.99] translate-y-1' : 'opacity-100 scale-100 translate-y-0'
              } ${
                viewStyle === 'card' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'
              }`}>
                {filteredPosts.map((post) => {
                  const isMatched = post.courseId ? enrolledCourseIds.has(post.courseId) : false;
                  const authorName = post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Anonymous User';
                  const authorAvatar = post.author?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face';
                  const authorRole = post.author?.role || 'STUDENT';
                  const createdAtFormatted = formatRelativeTime(post.createdAt);
                  const isLiked = post.likedByCurrentUser;
                  const likesCount = post.likesCount;
                  
                  const isCard = viewStyle === 'card';
                  const isExpanded = activeCommentPostId === post.id;

                  return (
                    <div 
                      key={post.id} 
                      className={`relative bg-gradient-to-b from-[var(--surface-card)] to-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-[2.5rem] shadow-sm transition-all duration-300 hover:shadow-xl hover:border-brand-500/20 overflow-hidden group flex flex-col justify-between ${
                        isCard 
                          ? isExpanded 
                            ? 'md:col-span-2 p-8 space-y-6 hover:-translate-y-0.5' 
                            : 'col-span-1 p-6 space-y-4 hover:-translate-y-1'
                          : 'p-8 space-y-6 hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b from-brand-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img 
                              src={authorAvatar} 
                              alt={authorName} 
                              className={`rounded-2xl object-cover border-2 border-[var(--surface-border)] group-hover:border-brand-500/30 transition-colors shadow-sm ${
                                isCard && !isExpanded ? 'h-10 w-10' : 'h-12 w-12'
                              }`}
                            />
                            <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white border border-[var(--surface-card)]">
                              {authorRole === 'INSTRUCTOR' ? '🎓' : authorRole === 'ADMIN' ? '🛠️' : '💬'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-extrabold text-[var(--text-heading)] group-hover:text-brand-500 transition-colors ${
                                isCard && !isExpanded ? 'text-sm' : 'text-base'
                              }`}>{authorName}</span>
                              {post.author?.username && (
                                <span className="text-[10px] font-bold text-brand-500/80 bg-brand-500/5 px-2 py-0.5 rounded-lg border border-brand-500/10">@{post.author.username}</span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-[var(--color-text-main)]/50 mt-1 flex items-center gap-2">
                              <span>{createdAtFormatted}</span>
                              <span className="h-1 w-1 rounded-full bg-[var(--color-text-main)]/35" />
                              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${
                                authorRole === 'INSTRUCTOR' ? 'text-indigo-500' :
                                authorRole === 'ADMIN' ? 'text-rose-500' :
                                'text-brand-500'
                              }`}>
                                {authorRole}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-extrabold bg-brand-500/5 hover:bg-brand-500/10 border border-[var(--surface-border)] px-4.5 py-1.5 rounded-full text-brand-500 max-w-[150px] sm:max-w-[200px] truncate transition shadow-inner">
                            {post.courseTitle}
                          </span>
                          {isMatched && (
                            <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Enrolled Track
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="space-y-3 pl-1 flex-1">
                        <h3 className={`font-black text-[var(--text-heading)] tracking-tight leading-tight group-hover:text-brand-500/90 transition-colors ${
                          isCard && !isExpanded ? 'text-lg line-clamp-2' : 'text-2xl'
                        }`}>{post.title}</h3>
                        
                        <p className={`leading-relaxed text-[var(--color-text-main)]/85 whitespace-pre-wrap font-medium ${
                          isCard && !isExpanded ? 'text-xs line-clamp-3' : 'text-base'
                        }`}>{renderMessageWithTags(post.body)}</p>
                        
                        {post.mediaUrl && (
                          <div className={`overflow-hidden rounded-[24px] border border-[var(--surface-border)] shadow-md hover:shadow-lg transition duration-300 ${
                            isCard && !isExpanded ? 'mt-2' : 'mt-4'
                          }`}>
                            <img 
                              src={post.mediaUrl} 
                              alt="Discussion media" 
                              className={`w-full object-cover hover:scale-[1.02] transition duration-500 ${
                                isCard && !isExpanded ? 'max-h-36' : 'max-h-[420px]'
                              }`} 
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={`flex items-center gap-4 border-t border-[var(--surface-border)] ${
                        isCard && !isExpanded ? 'pt-4' : 'pt-5'
                      }`}>
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-2 font-extrabold rounded-2xl transition-all duration-300 active:scale-95 border ${
                            isCard && !isExpanded ? 'text-[10px] px-3.5 py-2' : 'text-xs px-5 py-3'
                          } ${
                            isLiked
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm'
                              : 'bg-[var(--surface-card-soft)] hover:bg-[var(--surface-card)] text-[var(--color-text-main)]/70 border border-[var(--surface-border)]'
                          }`}
                        >
                          <ThumbsUp className={`transition-transform group-active:scale-90 ${
                            isCard && !isExpanded ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
                          } ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{likesCount} Like{likesCount !== 1 ? 's' : ''}</span>
                        </button>

                        <button
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                          className={`flex items-center gap-2 font-extrabold rounded-2xl transition-all duration-300 active:scale-95 border ${
                            isCard && !isExpanded ? 'text-[10px] px-3.5 py-2' : 'text-xs px-5 py-3'
                          } ${
                            isExpanded
                              ? 'bg-brand-500/10 text-brand-500 border-brand-500/20 shadow-sm'
                              : 'bg-[var(--surface-card-soft)] hover:bg-[var(--surface-card)] text-[var(--color-text-main)]/70 border border-[var(--surface-border)]'
                          }`}
                        >
                          <MessageSquare className={isCard && !isExpanded ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} />
                          <span>{post.comments.length} {post.comments.length === 1 ? 'Reply' : 'Replies'}</span>
                        </button>
                      </div>

                      {/* Comments/Replies Area */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-[var(--surface-border)] space-y-5 relative pl-4 sm:pl-6">
                          {/* Vertical connector thread line */}
                          <div className="absolute left-0 top-0 bottom-12 w-0.5 border-l-2 border-dashed border-[var(--surface-border)]" />

                          {/* Comments Feed */}
                          <div className="space-y-4">
                            {post.comments.map((comment) => {
                              const commentAuthorName = comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : 'Anonymous User';
                              const commentAuthorAvatar = comment.author?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face';
                              const commentAuthorRole = comment.author?.role || 'STUDENT';
                              
                              return (
                                <div key={comment.id} className="relative bg-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-[24px] p-5 flex items-start gap-4 transition hover:border-brand-500/10">
                                  {/* Small horizontal thread connector */}
                                  <div className="absolute -left-4 sm:-left-6 top-8 w-4 sm:w-6 border-t-2 border-dashed border-[var(--surface-border)]" />
                                  
                                  <img 
                                    src={commentAuthorAvatar} 
                                    alt={commentAuthorName} 
                                    className="h-10 w-10 rounded-xl object-cover border border-[var(--surface-border)] shadow-sm"
                                  />
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-extrabold text-sm text-[var(--text-heading)]">{commentAuthorName}</span>
                                        {comment.author?.username && (
                                          <span className="text-xs font-bold text-brand-500">@{comment.author.username}</span>
                                        )}
                                        <span className="text-[9px] font-extrabold bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                          {commentAuthorRole}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-[var(--color-text-main)]/40 font-bold">{formatRelativeTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-[var(--color-text-main)]/90 font-medium break-words">{renderMessageWithTags(comment.message)}</p>
                                    <div className="flex items-center gap-3 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleLikeComment(post.id, comment.id)}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                                          comment.likedByCurrentUser
                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10'
                                            : 'bg-transparent text-[var(--color-text-main)]/50 hover:text-[var(--text-heading)] hover:bg-[var(--surface-card)] border border-transparent'
                                        }`}
                                      >
                                        <ThumbsUp className={`w-3.5 h-3.5 ${comment.likedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                                        <span>{comment.likesCount || 0}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const mentionStr = comment.author?.username ? `@${comment.author.username} ` : `@${comment.author.firstName.toLowerCase()}_${comment.author.lastName.toLowerCase()} `;
                                          setCommentText((prev) => prev.includes(mentionStr) ? prev : prev + mentionStr);
                                        }}
                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all text-[var(--color-text-main)]/50 hover:text-brand-500 hover:bg-[var(--surface-card)]"
                                      >
                                        <Reply className="w-3.5 h-3.5" />
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Comment Input */}
                          <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex items-center gap-3 relative pl-1 mt-2">
                            {/* Dashed line to input */}
                            <div className="absolute -left-4 sm:-left-6 top-0 bottom-5 w-0.5 border-l-2 border-dashed border-[var(--surface-border)]" />
                            <div className="absolute -left-4 sm:-left-6 bottom-5 w-6 border-b-2 border-dashed border-[var(--surface-border)]" />

                            <img 
                              src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'} 
                              alt="Your Avatar" 
                              className="h-10 w-10 rounded-xl object-cover border border-[var(--surface-border)] shadow-sm z-10"
                            />
                            <div className="flex-1 flex items-center bg-[var(--surface-card-soft)] border border-[var(--surface-border)] rounded-[20px] px-5 py-3 focus-within:border-brand-500 focus-within:bg-[var(--surface-card)] transition-all duration-300 shadow-inner z-10">
                              <input
                                type="text"
                                placeholder="Write a reply, use @username to tag..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="w-full bg-transparent text-sm text-[var(--text-heading)] outline-none placeholder:text-[var(--color-text-main)]/45"
                              />
                              <button type="submit" className="text-brand-500 hover:text-brand-600 transition-colors p-1.5 hover:bg-brand-500/10 rounded-xl ml-2">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal for Creating Discussion */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            
            <div className="relative w-full max-w-xl rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-8 shadow-2xl z-10">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-black text-[var(--text-heading)] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-500" />
                  New Discussion
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-sm text-[var(--color-text-main)]/60 hover:text-[var(--text-heading)] font-bold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)]/70 mb-2 pl-2">DISCUSSION TITLE</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="e.g. How to handle state updates in React Server Components?"
                    className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)] placeholder:text-[var(--color-text-main)]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)]/70 mb-2 pl-2">RELATED COURSE / CERTIFICATION</label>
                  <select
                    value={newPost.courseId}
                    onChange={(e) => setNewPost({ ...newPost, courseId: e.target.value })}
                    className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)]"
                  >
                    <option value="">General Discussion (No course match)</option>
                    {enrollments.map(e => (
                      <option key={e.course.id} value={e.course.id}>{e.course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)]/70 mb-2 pl-2">DISCUSSION BODY</label>
                  <textarea
                    value={newPost.body}
                    onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                    placeholder="Describe your issue or what you want to share with other students/instructors..."
                    className="w-full min-h-36 rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)] placeholder:text-[var(--color-text-main)]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)]/70 mb-2 pl-2">IMAGE URL (OPTIONAL)</label>
                  <input
                    type="url"
                    value={newPost.mediaUrl}
                    onChange={(e) => setNewPost({ ...newPost, mediaUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or any image URL"
                    className="w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-5 py-4 text-sm outline-none transition focus:border-brand-500 text-[var(--text-heading)] placeholder:text-[var(--color-text-main)]/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-brand-500 py-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(var(--brand-500-rgb,59,130,246),0.25)] hover:bg-brand-600 transition"
                >
                  Publish Post
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
