import type { MetadataRoute } from 'next'

const icons = [
  {
    url: '/icon.png',
    src: '/icon.png',
    sizes: '512x512',
    type: 'image/png',
  },
  {
    url: '/apple-icon.png',
    src: '/apple-icon.png',
    sizes: '180x180',
    type: 'image/png',
  },
]

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IONIC',
    short_name: 'IONIC',
    description: 'Private venture marketplace for accredited investors.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0814',
    theme_color: '#7c4dff',
    icons,
  }
}
