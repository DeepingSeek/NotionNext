import { HashTag } from '@/components/HeroIcons'
import LazyImage from '@/components/LazyImage'
import NotionIcon from '@/components/NotionIcon'
import WordCount from '@/components/WordCount'
import { siteConfig } from '@/lib/config'
import { formatDateFmt } from '@/lib/utils/formatDate'
import SmartLink from '@/components/SmartLink'
import WavesArea from './WavesArea'
import CONFIG from '../config'

/**
 * 文章页头
 * @param {*} param0
 * @returns
 */
export default function PostHeader({ post, siteInfo, isDarkMode, lock }) {
  if (!post) {
    return <></>
  }
  // 文章头图
  const headerImage = post?.pageCover ? post.pageCover : siteInfo?.pageCover
  const ANALYTICS_BUSUANZI_ENABLE = siteConfig('ANALYTICS_BUSUANZI_ENABLE')
  // 封面模糊半径与遮罩强度，可在 themes/heo/config.js 中调整
  const coverBlur = Math.max(0, Number(siteConfig('HEO_POST_COVER_BLUR', 6, CONFIG)) || 0)
  const coverOverlay = Math.min(1, Math.max(0, Number(siteConfig('HEO_POST_COVER_OVERLAY', 0.4, CONFIG)) || 0))
  return (
    <div
      id='post-bg'
      className='md:mb-0 -mb-5 w-full h-[30rem] relative md:flex-shrink-0 overflow-hidden bg-cover bg-center bg-no-repeat z-10'
      style={{
        '--heo-post-bg-accent': isDarkMode
          ? 'var(--heo-color-accent)'
          : 'var(--heo-color-primary)'
      }}>
      <div
        className='absolute top-0 w-full h-full py-10 flex justify-center items-center'
        style={{ backgroundColor: 'var(--heo-post-bg-accent)' }}>
        {/* 文章背景图：铺满头部区域，任意尺寸的封面都通过 object-cover 裁切填充；
            -inset-10 让模糊产生的边缘落在可视区域之外，避免四周发虚 */}
        {headerImage && (
          <div
            id='post-cover-wrapper'
            className='absolute -inset-10'
            style={coverBlur > 0 ? { filter: `blur(${coverBlur}px)` } : undefined}>
            <LazyImage
              id='post-cover'
              priority
              className='w-full h-full object-cover'
              src={headerImage}
            />
          </div>
        )}

        {/* 暗色渐变遮罩，保证白色标题与导航在任何封面上都清晰可读；强度由 HEO_POST_COVER_OVERLAY 控制 */}
        {headerImage && coverOverlay > 0 && (
          <div
            className='absolute inset-0 pointer-events-none'
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,${(coverOverlay * 0.75).toFixed(3)}), rgba(0,0,0,${coverOverlay}), rgba(0,0,0,${Math.min(1, coverOverlay * 1.5).toFixed(3)}))`
            }}
          />
        )}

        {/* 文章文字描述 */}
        <div
          id='post-info'
          className='absolute top-48 z-10 flex flex-col space-y-4 lg:-mt-12 w-full max-w-[86rem] px-5'>
          {/* 分类+标签 */}
          <div className='flex justify-center md:justify-start items-center gap-4'>
            {post.category && (
              <>
                <SmartLink
                  href={`/category/${post.category}`}
                  className='mr-4'
                  passHref
                  legacyBehavior>
                  <div className='cursor-pointer font-sm font-bold px-3 py-1 rounded-lg hover:bg-white text-[var(--heo-color-primary-text)] bg-[var(--heo-color-primary)] dark:bg-[var(--heo-color-accent)] hover:text-[var(--heo-color-primary)] duration-200 '>
                    {post.category}
                  </div>
                </SmartLink>
              </>
            )}

            {post.tagItems && (
              <div className='hidden md:flex justify-center flex-nowrap overflow-x-auto'>
                {post.tagItems.map((tag, index) => (
                  <SmartLink
                    key={index}
                    href={`/tag/${encodeURIComponent(tag.name)}`}
                    passHref
                    className={
                      'cursor-pointer inline-block text-gray-50 hover:text-white duration-200 py-0.5 px-1 whitespace-nowrap '
                    }>
                    <div className='font-light flex items-center'>
                      <HashTag className='text-gray-200 stroke-2 mr-0.5 w-3 h-3' />{' '}
                      {tag.name + (tag.count ? `(${tag.count})` : '')}{' '}
                    </div>
                  </SmartLink>
                ))}
              </div>
            )}
          </div>

          {/* 文章Title */}
          <div className='max-w-5xl font-bold text-3xl lg:text-5xl md:leading-snug shadow-text-md flex  justify-center md:justify-start text-white'>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post.pageIcon} />
            )}
            {post.title}
          </div>

          {/* 标题底部补充信息 */}
          <section className='flex-wrap dark:text-gray-200 text-opacity-70 shadow-text-md flex text-sm  justify-center md:justify-start mt-4 text-white font-light leading-8'>
            <div className='flex justify-center '>
              {!lock && (
                <div className='mr-2'>
                  <WordCount
                    wordCount={post.wordCount}
                    readTime={post.readTime}
                  />
                </div>
              )}
              {post?.type !== 'Page' && (
                <>
                  <SmartLink
                    href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
                    passHref
                    className='pl-1 mr-2 cursor-pointer hover:underline'>
                    <i className='fa-regular fa-calendar'></i>{' '}
                    {post?.publishDay}
                  </SmartLink>
                </>
              )}

              <div className='pl-1 mr-2'>
                <i className='fa-regular fa-calendar-check'></i>{' '}
                {post.lastEditedDay}
              </div>
            </div>

            {/* 阅读统计 */}
            {ANALYTICS_BUSUANZI_ENABLE && (
              <div className='busuanzi_container_page_pv font-light mr-2'>
                <i className='fa-solid fa-fire-flame-curved'></i>{' '}
                <span className='mr-2 busuanzi_value_page_pv' />
              </div>
            )}
          </section>
        </div>

        <WavesArea />
      </div>
    </div>
  )
}
