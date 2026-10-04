// Newest articles are displayed first. Dates are publication dates (YYYY-MM-DD).
// Replace the demo with sourced editorial content when publishing real news.
export const techNews = [
  {
    slug: 'welcome-to-tech-notes',
    date: '2026-10-04',
    title: 'A space for frontend & AI discoveries',
    summary: 'A preview of this news journal: concise context, practical takeaways, and room to explore the details behind each story.',
    tags: ['Frontend', 'AI'],
    demo: true,
    image: '/images/tech-news-cover.svg',
    imageAlt: 'Illustration of a browser window connected to a network of AI nodes',
    imageCaption: 'Frontend × AI — an illustration for this journal preview.',
    sections: [
      {
        heading: 'Welcome to Tech News',
        paragraphs: [
          'This is a layout preview, not a current news report. This journal will be a place to collect frontend and AI stories, explain their context, and reflect on what they mean for building useful products.',
        ],
      },
      {
        heading: 'Short summaries, with space for detail',
        paragraphs: [
          'Each entry starts with a publication date, a short summary, and an estimated reading time. Open an article to read the full story, explore illustrations, and follow the original sources.',
          'Future entries can cover browser capabilities, interface engineering, and AI-assisted development. The aim is to separate what was announced from practical interpretation, so readers can decide what is worth exploring further.',
        ],
      },
      {
        heading: 'Sources before conclusions',
        paragraphs: [
          'Real news entries should link to the original announcement or documentation, distinguish confirmed details from commentary, and include only images that can be used with permission. This entry is a layout preview, not a daily news report.',
        ],
      },
    ],
    sources: [],
    translations: {
      'zh-TW': {
        title: '探索前端與 AI 的新知角落',
        summary: '新聞專欄的版型預覽：用簡明的背景、實用觀點與完整文章，理解每則消息背後的意義。',
        tags: ['前端', 'AI'],
        imageAlt: '瀏覽器視窗連接 AI 節點網路的插畫',
        imageCaption: '前端 × AI：本專欄的示範插畫。',
        sections: [
          {
            heading: '歡迎來到 Tech News',
            paragraphs: ['這是一篇版型示範，不是即時新聞。本專欄將整理前端與 AI 消息，交代背景，並思考這些發展對打造實用產品的意義。'],
          },
          {
            heading: '簡短摘要，深入閱讀',
            paragraphs: [
              '每篇文章包含發布日期、簡短摘要與預估閱讀時間。點進文章後，可以閱讀完整內容、查看圖片，並追溯原始來源。',
              '未來內容可涵蓋瀏覽器能力、介面工程與 AI 輔助開發。我們會區分已發布的事實與實務解讀，幫助讀者判斷值得深入研究的方向。',
            ],
          },
          {
            heading: '先查證，再下結論',
            paragraphs: [
              '正式新聞應附上原始公告或文件，區分可確認的資訊與評論，並只使用有權使用的圖片。本篇僅供版型預覽，不代表當日新聞。',
            ],
          },
        ],
      },
    },
  },
]

export function readingMinutes(article) {
  const text = article.sections.map(({ heading, paragraphs }) => [heading, ...paragraphs].join(' ')).join(' ')
  const cjkCharacters = (text.match(/[\u3400-\u9fff]/g) || []).length
  const words = text
    .replace(/[\u3400-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200 + cjkCharacters / 400))
}

export function localizeArticle(article, language) {
  return { ...article, ...article.translations?.[language] }
}

export function formatNewsDate(date, language = 'en') {
  return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}
