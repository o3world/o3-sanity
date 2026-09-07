import 'server-only'

/** Choose local study styling before the server-rendered cards can paint. */
export function WorkStudyStartup() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.dataset.workStudy=new URLSearchParams(location.search).get('workMembrane')||'off';document.documentElement.toggleAttribute('data-work-cards-hidden',new URLSearchParams(location.search).get('hideWorkCards')==='1')`,
      }}
    />
  )
}
