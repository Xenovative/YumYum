import { useEffect } from 'react'

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
}

export interface SEOProps {
  title: string
  description?: string
  canonical?: string
  ogImage?: string
  jsonLd?: Record<string, any>
}

export default function SEO({ title, description, canonical, ogImage, jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title
    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description })
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
      upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    }
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })

    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', canonical)
    }

    if (ogImage) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage })
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage })
    }

    if (jsonLd) {
      let script = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld="true"]')
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-seo-jsonld', 'true')
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(jsonLd)
    }
  }, [title, description, canonical, ogImage, jsonLd])

  return null
}
