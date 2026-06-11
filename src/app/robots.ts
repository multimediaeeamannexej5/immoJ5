import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eeam-annexej5.ma'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin',
          '/admin/',
          '/treasurer',
          '/treasurer/',
          '/dashboard',
          '/dashboard/',
          '/donate',
          '/auth/',
          '/api/',
          '/annexeJ5',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host:    base,
  }
}
