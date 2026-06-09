'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, MessageSquare, Search, Sparkles, ThumbsUp, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { addCommunityPostComment, getCommunityPosts, getMyEnrollments, toggleCommunityPostLike } from '@/lib/api';
import { readSession } from '@/lib/auth';
import { useProtectedPage } from '@/lib/use-protected-page';
import { CommunityPost, Enrollment } from '@/types';

export default function CommunityForum() {
  const { user } = useProtectedPage();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'MATCHED'>('ALL');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const refresh = async () => {
    const [nextPosts, nextEnrollments] = await Promise.all([getCommunityPosts(), getMyEnrollments()]);
    setPosts(nextPosts);
    setEnrollments(nextEnrollments || []);
  };

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    refresh()
      .finally(() => setLoading(false));
  }, []);

  const enrolledCourseIds = useMemo(() => new Set(enrollments.map((enrollment) => enrollment.course.id)), [enrollments]);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return posts.filter((post) => {
      if (selectedCourseFilter !== 'all' && post.courseId !== selectedCourseFilter) {
        return false;
      }
      if (filterMode === 'MATCHED' && post.courseId && !enrolledCourseIds.has(post.courseId)) {
        return false;
      }
      if (!term) {
        return true;
      }

      return (
        post.title.toLowerCase().includes(term) ||
        post.body.toLowerCase().includes(term) ||
        `${post.author.firstName} ${post.author.lastName}`.toLowerCase().includes(term) ||
        post.courseTitle.toLowerCase().includes(term)
      );
    });
  }, [enrolledCourseIds, filterMode, posts, searchTerm, selectedCourseFilter]);

  const handleLike = async (postId: string) => {
    setSavingPostId(postId);
    try {
      const result = await toggleCommunityPostLike(postId);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: result.likesCount,
                likedByCurrentUser: !post.likedByCurrentUser,
              }
            : post,
        ),
      );
    } finally {
      setSavingPostId(null);
    }
  };

  const handleReply = async (postId: string) => {
    const message = replyDrafts[postId]?.trim();
    if (!message) {
      return;
    }

    setSavingPostId(postId);
    try {
      await addCommunityPostComment(postId, message);
      setReplyDrafts((current) => ({ ...current, [postId]: '' }));
      await refresh();
      setActiveCommentPostId(postId);
    } finally {
      setSavingPostId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role === 'INSTRUCTOR' ? 'instructor' : 'student'}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="mt-4 font-medium text-[var(--color-text-main)]/60">Loading community posts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role === 'INSTRUCTOR' ? 'instructor' : 'student'}>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
                <Users className="h-3.5 w-3.5" /> CourseForge Community
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[var(--text-heading)] md:text-[2.6rem]">
                CourseForge Community
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-main)]/80">
                Students can like posts and reply directly. The content comes from the database seed.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-4 py-3 text-sm font-bold text-[var(--text-heading)]">
              {posts.length} seeded posts
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] p-5 lg:flex-row lg:items-center lg:justify-between">
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
                <Sparkles className="h-3.5 w-3.5" />
                My Courses Only
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-main)]/60">Topic:</span>
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-xs font-bold text-[var(--text-heading)] outline-none focus:border-brand-500"
              >
                <option value="all">All Courses / Categories</option>
                {enrollments.map((enrollment) => (
                  <option key={enrollment.course.id} value={enrollment.course.id}>
                    {enrollment.course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-main)]/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] py-2 pl-9 pr-4 text-xs font-medium text-[var(--text-heading)] outline-none focus:border-brand-500"
            />
          </div>
        </section>

        {filterMode === 'MATCHED' && enrollments.length === 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <AlertCircle className="h-4 w-4" />
            Not enrolled in any courses yet.
          </div>
        )}

        <section className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="rounded-[32px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-12 text-center shadow-inner">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-[var(--color-text-main)]/30" />
              <h3 className="text-xl font-bold text-[var(--text-heading)]">No conversations found</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-text-main)]/60">
                No seeded posts match this filter.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/student/community-links"
                  className="inline-flex items-center rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white"
                >
                  Open Community links
                </Link>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isMatched = post.courseId ? enrolledCourseIds.has(post.courseId) : false;
              const expanded = activeCommentPostId === post.id;
              const authorName = `${post.author.firstName} ${post.author.lastName}`.trim();
              const avatar = post.author.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face';
              const liked = Boolean(post.likedByCurrentUser);

              return (
                <article
                  key={post.id}
                  className="space-y-5 rounded-[30px] border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 shadow-sm transition hover:border-[var(--surface-border)]/80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={avatar} alt={authorName} className="h-11 w-11 rounded-full border border-[var(--surface-border)] object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-heading)]">{authorName}</span>
                          <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-brand-500">
                            {post.author.role}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-text-main)]/50">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-card-soft)] px-3 py-1 text-[10px] font-bold text-[var(--color-text-main)]/80">
                        {post.courseTitle}
                      </span>
                      {isMatched && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Matched
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pl-1">
                    <h3 className="text-xl font-bold tracking-tight text-[var(--text-heading)]">{post.title}</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-main)]/80">{post.body}</p>
                  </div>

                  <div className="flex items-center gap-4 border-t border-[var(--surface-border)] pt-4 text-xs font-bold text-[var(--color-text-main)]/70">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      disabled={savingPostId === post.id}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 transition ${
                        liked
                          ? 'border border-brand-500/20 bg-brand-500/10 text-brand-500'
                          : 'border border-transparent bg-[var(--surface-card-soft)] hover:bg-[var(--surface-card)]'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-brand-500' : ''}`} />
                      {post.likesCount} Like{post.likesCount === 1 ? '' : 's'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCommentPostId(expanded ? null : post.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-card-soft)] px-4 py-2 transition hover:bg-[var(--surface-card)]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {post.comments.length} repl{post.comments.length === 1 ? 'y' : 'ies'}
                    </button>
                  </div>

                  {expanded && (
                    <div className="space-y-4 border-t border-[var(--surface-border)] pt-4">
                      {post.comments.map((comment) => {
                        const commentAuthor = `${comment.author.firstName} ${comment.author.lastName}`.trim();
                        const commentAvatar = comment.author.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face';

                        return (
                          <div key={comment.id} className="flex items-start gap-3 rounded-[20px] border border-[var(--surface-border)] bg-[var(--surface-card-soft)] p-4">
                            <img src={commentAvatar} alt={commentAuthor} className="h-8 w-8 rounded-full border border-[var(--surface-border)] object-cover" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[var(--text-heading)]">{commentAuthor}</span>
                                  <span className="rounded-full bg-brand-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-brand-500">
                                    {comment.author.role}
                                  </span>
                                </div>
                                <span className="text-[9px] font-semibold text-[var(--color-text-main)]/40">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-[var(--color-text-main)]/90">{comment.message}</p>
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-start gap-3">
                        <img
                          src={user?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face'}
                          alt="Your Avatar"
                          className="h-8 w-8 rounded-full border border-[var(--surface-border)] object-cover"
                        />
                        <div className="flex-1">
                          <textarea
                            value={replyDrafts[post.id] || ''}
                            onChange={(e) => setReplyDrafts((current) => ({ ...current, [post.id]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="min-h-24 w-full rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-heading)] outline-none focus:border-brand-500"
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReply(post.id)}
                              disabled={savingPostId === post.id}
                              className="inline-flex items-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
