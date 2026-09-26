import { notFound } from 'next/navigation'

/** Route the reserved /404 URL through the site's branded not-found boundary. */
export default function NotFoundPage() {
  notFound()
}
