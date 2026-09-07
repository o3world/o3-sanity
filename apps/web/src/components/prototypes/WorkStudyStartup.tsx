import 'server-only'

/** Choose local study styling before the server-rendered cards can paint. */
export function WorkStudyStartup() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.dataset.workStudy=new URLSearchParams(location.search).get('workMembrane')||'off'`,
      }}
    />
  )
}
