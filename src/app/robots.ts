import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://todovisa.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/profile/',
          '/preformulario/',
          '/citas/',
          '/referral/',
          '/referido/',
          '/agents/portal/',
          '/agents/apply/',
          '/vipro-form/evaluation/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
