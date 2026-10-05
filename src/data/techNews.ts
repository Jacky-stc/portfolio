// Newest articles are displayed first. Dates are publication dates (YYYY-MM-DD).
// Distinguish the digest date from the original source publication dates.
export type NewsLanguage = 'en' | 'zh-TW'
export interface ArticleContent {
  title: string
  summary: string
  tags: string[]
  sections: { heading: string; paragraphs: string[] }[]
  sources: { label: string; url: string }[]
  imageAlt?: string
  imageCaption?: string
  socialImageAlt?: string
}
export interface NewsArticle extends ArticleContent {
  slug: string
  date: string
  demo?: boolean
  image?: string
  socialImage?: string
  translations: Record<'zh-TW', ArticleContent>
}

export const techNews: NewsArticle[] = [
  {
    slug: 'september-browser-baseline-anthropic-interviews',
    date: '2026-10-05',
    title: 'Browser support catches up, while Anthropic asks users what they want',
    summary: 'A look back at recent browser interoperability updates and an ongoing study of people’s experiences with AI.',
    tags: ['Browsers', 'CSS', 'AI', 'Research'],
    image: '/images/tech-news-cover.svg',
    imageAlt: 'An illustrated browser window connected to AI nodes',
    imageCaption: 'Original site illustration, not a screenshot of the products discussed.',
    sections: [
      {
        heading: 'Less custom code for scrolling and images',
        paragraphs: [
          'This October 5 edition looks back over the past week. In its October 2 browser roundup, web.dev reports that Safari 27 brings scroll anchoring and sizes="auto" for lazy-loaded images to Baseline Newly available. The former helps keep reading positions steady when content above changes; the latter lets image selection follow the rendered width.',
          'The same roundup highlights broader support for CSS alpha(), which changes a color’s transparency. These are compatibility milestones, not a reason to drop support for older browsers without checking your audience.',
        ],
      },
      {
        heading: 'A study that can make the interviews public',
        paragraphs: [
          'Anthropic’s September 29 announcement invites Claude users to discuss their experiences with AI in a study running through October 6. Participants can choose whether to publish their full interview. Publication omits account details but includes the associated country; personal stories can still reveal identity.',
          'This is a study invitation, not a release of findings. Anthropic acknowledges that Claude users do not represent the general public, and people choosing publication form another self-selected group. Those limits matter when interpreting the eventual results.',
        ],
      },
    ],
    sources: [
      { label: 'web.dev · September browser roundup · October 2, 2026', url: 'https://web.dev/blog/web-platform-09-2026' },
      { label: 'Anthropic · User interview study · September 29, 2026', url: 'https://www.anthropic.com/research/your-thoughts-on-ai' },
    ],
    translations: {
      'zh-TW': {
        title: '瀏覽器支援逐漸到位，Anthropic 則向使用者提問',
        summary: '回顧近期瀏覽器互通性更新，以及仍在進行中的 AI 使用經驗訪談研究。',
        tags: ['瀏覽器', 'CSS', 'AI', '研究'],
        imageAlt: '瀏覽器視窗連接 AI 節點的插畫',
        imageCaption: '本站原創插畫，並非文中產品的操作截圖。',
        sections: [
          {
            heading: '捲動與圖片選擇，少一些自訂處理',
            paragraphs: [
              '這篇 10 月 5 日的整理回顧近一週消息。web.dev 在 10 月 2 日的瀏覽器回顧指出，Safari 27 讓捲動錨定與延遲載入圖片的 sizes="auto" 達到 Baseline Newly available。前者減少上方內容變動造成的閱讀位置跳動；後者讓圖片來源選擇依據實際呈現寬度。',
              '回顧也列出 CSS alpha() 的跨瀏覽器支援進展，可用來調整顏色透明度。這些是相容性里程碑，不代表不必確認使用者環境，就能移除舊版瀏覽器的支援。',
            ],
          },
          {
            heading: '這次訪談可以選擇公開',
            paragraphs: [
              'Anthropic 在 9 月 29 日宣布邀請 Claude 使用者分享 AI 使用經驗，研究持續至 10 月 6 日。參與者可自行決定是否公開完整訪談；公開版本不包含帳號資料，但會附上對話關聯的國家，敘述中的個人細節仍可能暴露身分。',
              '這是研究招募，並非研究結果發表。Anthropic 也承認，Claude 使用者不能代表整體大眾，願意公開訪談的人又是另一層自選樣本。閱讀未來結果時，需要保留這些限制。',
            ],
          },
        ],
        sources: [
          { label: 'web.dev · 九月瀏覽器回顧 · 2026 年 10 月 2 日', url: 'https://web.dev/blog/web-platform-09-2026' },
          { label: 'Anthropic · 使用者訪談研究 · 2026 年 9 月 29 日', url: 'https://www.anthropic.com/research/your-thoughts-on-ai' },
        ],
      },
    },
  },
  {
    slug: 'openai-devday-2026-github-css-modules',
    date: '2026-10-04',
    title: 'OpenAI DevDay highlights and GitHub’s move to CSS Modules',
    summary:
      'A closer look at GPT-6.1 Sol, dots, and the September 29 developer updates, alongside GitHub’s account of removing CSS-in-JS.',
    tags: ['Frontend', 'AI', 'CSS', 'Developer Workflow'],
    image: '/images/tech-news-cover.svg',
    imageAlt: 'Illustration of a browser window connected to a network of AI nodes',
    imageCaption: 'Site illustration: frontend interfaces and AI systems, not a product screenshot.',
    sections: [
      {
        heading: 'What changed at OpenAI DevDay',
        paragraphs: [
          'The September 29 DevDay updates brought changes to both ChatGPT and the developer platform. This October 4 edition brings together those announcements and GitHub’s recent engineering posts, with the original publication dates kept alongside each story.',
          'Dots take on ongoing tasks across connected apps and return results for review; access is rolling out gradually. ChatGPT Space brings files and editable Pages into a shared workspace. Codex also gained reusable cloud environments, letting developers continue cloud tasks while their own computer is asleep.',
        ],
      },
      {
        heading: 'GPT-6.1 Sol and a faster tier for Astra',
        paragraphs: [
          'GPT-6.1 Sol arrived on September 29 for coding and professional work at a lower cost than Astra. Its standard rates, for prompts up to 272K input tokens, are $2 per million input tokens and $10 per million output tokens. OpenAI positions it near Astra in capability, but recommends comparing the models on your own tasks.',
          'Astra’s new Ultrafast tier reduces the time between output tokens in the Responses API. It has rate limits and supports global processing and US data residency, not EU inference residency. Separately, the Agents API added browser-based computer use; the application remains responsible for website-access approvals and sign-in. Sol’s multi-agent support is still in beta.',
        ],
      },
      {
        heading: 'GitHub moves its styles to CSS Modules',
        paragraphs: [
          'In its September 25 retrospective, GitHub describes replacing CSS-in-JS with CSS Modules. After migrating Primer components, it reported 55% less server-rendering time and 25% less component initialization time. These figures describe that migration stage, not a universal speedup for every site.',
        ],
      },
      {
        heading: 'Writing the code is only part of the job',
        paragraphs: [
          'GitHub’s October 2 article looks at the skills needed when agents do more of the implementation: giving them clear direction, checking their output, and making technical decisions. The focus is on how developers work, rather than another product launch.',
        ],
      },
    ],
    sources: [
      {
        label: 'OpenAI · DevDay 2026 · September 29, 2026',
        url: 'https://learn.chatgpt.com/docs/whats-new/devday-2026',
      },
      {
        label: 'OpenAI · API changelog · September 29, 2026',
        url: 'https://developers.openai.com/api/docs/changelog',
      },
      {
        label: 'OpenAI · GPT-6.1 Sol model documentation',
        url: 'https://developers.openai.com/api/docs/models/gpt-6.1-sol',
      },
      {
        label: 'GitHub · CSS migration retrospective · September 25, 2026',
        url: 'https://github.blog/engineering/architecture-optimization/improving-site-performance-by-shipping-more-css/',
      },
      {
        label: 'GitHub · Three skills for AI-assisted development · October 2, 2026',
        url: 'https://github.blog/ai-and-ml/ai-is-rewriting-the-developer-career-ladder-heres-how-to-stand-out/',
      },
    ],
    translations: {
      'zh-TW': {
        title: 'OpenAI DevDay 更新整理，以及 GitHub 告別 CSS-in-JS 的過程',
        summary: '回顧 9 月 29 日的 GPT-6.1 Sol、dots 與開發工具更新，也看看 GitHub 為什麼將網站樣式改成 CSS Modules。',
        tags: ['前端', 'AI', 'CSS', '開發流程'],
        imageAlt: '瀏覽器視窗連接 AI 節點網路的插畫',
        imageCaption: '本站插畫：前端介面與 AI 系統的連結，非產品截圖。',
        sections: [
          {
            heading: 'OpenAI 在 DevDay 帶來了哪些更新',
            paragraphs: [
              '9 月 29 日的 DevDay 同時更新了 ChatGPT 與開發者平台。這篇 10 月 4 日的整理回顧當天的消息，也收錄 GitHub 最近發布的工程文章；各段保留原始發布日期，方便對照。',
              'dots 可以跨已連接的應用程式持續處理任務，再交回結果供使用者審查，目前正逐步開放。ChatGPT Space 則將檔案與可編輯的 Pages 放進共享工作空間。Codex 也加入可重複使用的雲端開發環境，讓雲端任務在自己的電腦休眠後仍能繼續。',
            ],
          },
          {
            heading: 'GPT-6.1 Sol 與 Astra 的加速選項',
            paragraphs: [
              'GPT-6.1 Sol 在 9 月 29 日推出，主打以低於 Astra 的成本處理程式開發與專業工作。輸入不超過 272K tokens 時，標準價格為每百萬輸入 tokens 2 美元、輸出 10 美元。OpenAI 將它定位為能力接近 Astra 的選擇，但仍建議用自己的任務比較兩者。',
              'Astra 新增的 Ultrafast 服務等級可縮短 Responses API 的 token 輸出間隔，但有速率限制，支援全球處理與美國資料駐留，不支援歐盟推論駐留。另外，Agents API 加入瀏覽器操作能力；網站存取核准與登入仍由應用程式處理。Sol 的多代理功能則仍處於 beta 階段。',
            ],
          },
          {
            heading: 'GitHub 將網站樣式搬到 CSS Modules',
            paragraphs: [
              'GitHub 在 9 月 25 日回顧從 CSS-in-JS 遷移至 CSS Modules 的過程。Primer 元件遷移後，團隊回報伺服器渲染耗時減少 55%、元件初始化耗時減少 25%。這是該遷移階段的結果，不代表所有網站都能獲得相同提升。',
            ],
          },
          {
            heading: '寫完程式之後，還有哪些工作',
            paragraphs: [
              'GitHub 在 10 月 2 日的文章談到，當 agent 承擔更多實作，開發者仍需要清楚交代任務、檢查產出，並做出技術決策。文章關注的是開發工作的變化，而不是另一項產品發布。',
            ],
          },
        ],
        sources: [
          {
            label: 'OpenAI · DevDay 2026 · 2026 年 9 月 29 日',
            url: 'https://learn.chatgpt.com/docs/whats-new/devday-2026',
          },
          {
            label: 'OpenAI · API 更新紀錄 · 2026 年 9 月 29 日',
            url: 'https://developers.openai.com/api/docs/changelog',
          },
          {
            label: 'OpenAI · GPT-6.1 Sol 模型文件',
            url: 'https://developers.openai.com/api/docs/models/gpt-6.1-sol',
          },
          {
            label: 'GitHub · CSS 遷移回顧 · 2026 年 9 月 25 日',
            url: 'https://github.blog/engineering/architecture-optimization/improving-site-performance-by-shipping-more-css/',
          },
          {
            label: 'GitHub · AI 輔助開發的三項技能 · 2026 年 10 月 2 日',
            url: 'https://github.blog/ai-and-ml/ai-is-rewriting-the-developer-career-ladder-heres-how-to-stand-out/',
          },
        ],
      },
    },
  },
]

export function readingMinutes(article: Pick<ArticleContent, 'sections'>) {
  const text = article.sections.map(({ heading, paragraphs }) => [heading, ...paragraphs].join(' ')).join(' ')
  const cjkCharacters = (text.match(/[\u3400-\u9fff]/g) || []).length
  const words = text
    .replace(/[\u3400-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200 + cjkCharacters / 400))
}

export function localizeArticle(article: NewsArticle, language: NewsLanguage): NewsArticle {
  return { ...article, ...(language === 'zh-TW' ? article.translations['zh-TW'] : {}) }
}

export function formatNewsDate(date: string, language: NewsLanguage = 'en') {
  return new Intl.DateTimeFormat(language, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`)
  )
}
