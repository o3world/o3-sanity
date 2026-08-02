/**
 * GENERATED — do not edit. `pnpm --filter @o3/migration redirects` rewrites it.
 *
 * Every URL the WordPress site redirects today, resolved to where it ends up
 * (#24). Source: o3-world.live (2026-08-02T14:36:04.211Z) — the Redirection plugin's table plus Yoast
 * Premium's own redirect store, merged and collapsed so nothing chains.
 *
 * Two consumers, and they have to agree: `next.config.ts` serves these as
 * permanent redirects, and `app/sitemap.ts` refuses to advertise any path
 * that appears here. A URL that 301s and is also in the sitemap is a
 * contradiction search engines are entitled to punish.
 */

export interface GeneratedRedirect {
  readonly source: string
  readonly destination: string
}

export const GENERATED_REDIRECTS: readonly GeneratedRedirect[] = [
  {
    // via /about-1682 → /1682-conference → /1682-conference-ai-innovation
    source: '/1682-2',
    destination: '/1682-conference-ai-innovation',
  },
  {
    source: '/1682-conference',
    destination: '/1682-conference-ai-innovation',
  },
  {
    source: '/1682-photos',
    destination: '/1682-conference-ai-innovation',
  },
  {
    // via /1682-conference → /1682-conference-ai-innovation
    source: '/about-1682',
    destination: '/1682-conference-ai-innovation',
  },
  {
    source: '/about/culture',
    destination: '/about',
  },
  {
    source: '/about/team',
    destination: '/about',
  },
  {
    source: '/about/team/aleesha-halbach',
    destination: '/about',
  },
  {
    source: '/about/team/calvin-gohd',
    destination: '/about',
  },
  {
    source: '/about/team/christina-lewis',
    destination: '/about',
  },
  {
    source: '/about/team/christine-sheller',
    destination: '/about',
  },
  {
    source: '/about/team/christine-sheller-speaker-page',
    destination: '/about',
  },
  {
    source: '/about/team/daniel-laufer',
    destination: '/about',
  },
  {
    source: '/about/team/jay-forbes',
    destination: '/about',
  },
  {
    source: '/about/team/jocelyn-harper',
    destination: '/about',
  },
  {
    source: '/about/team/josh-soldiers',
    destination: '/about',
  },
  {
    source: '/about/team/joshua-buckwalter',
    destination: '/about',
  },
  {
    source: '/about/team/justin-handler',
    destination: '/about',
  },
  {
    source: '/about/team/justin-mathews',
    destination: '/about',
  },
  {
    source: '/about/team/keith-scandone',
    destination: '/about',
  },
  {
    source: '/about/team/keith-scandone-speaker-page',
    destination: '/about',
  },
  {
    source: '/about/team/lauren-slattery',
    destination: '/about',
  },
  {
    source: '/about/team/mahesh-gaitonde',
    destination: '/about',
  },
  {
    source: '/about/team/michael-tarquinio',
    destination: '/about',
  },
  {
    source: '/about/team/mike-gadsby',
    destination: '/about',
  },
  {
    source: '/about/team/mike-gadsby-2',
    destination: '/about',
  },
  {
    source: '/about/team/paige-hines-cheatham',
    destination: '/about',
  },
  {
    source: '/about/team/sam-roth',
    destination: '/about',
  },
  {
    source: '/about/team/tara-threewits',
    destination: '/about',
  },
  {
    source: '/about/team/tim-breslin',
    destination: '/about',
  },
  {
    source: '/about/team/zuhib-daud',
    destination: '/about',
  },
  {
    // via /solutions/web-digital-product → /solutions/conversion-rate-optimization-consultant
    source: '/accessibility-solutions',
    destination: '/solutions',
  },
  {
    source: '/acquia-o3',
    destination: '/solutions',
  },
  {
    // via /solutions/ai-solutions → /solutions/solutions-ai-for-b2b-growth
    source: '/ai-solutions',
    destination: 'https://www.o3xo.ai/',
  },
  {
    source: '/analyze',
    destination: '/solutions',
  },
  {
    source: '/benchmark-surveys',
    destination: '/solutions',
  },
  {
    source: '/campaigns/accessibility',
    destination: '/',
  },
  {
    source: '/campaigns/current-state-analysis-customer-service-audit',
    destination: '/',
  },
  {
    source: '/campaigns/current-state-analysis-employee-retention-audit',
    destination: '/',
  },
  {
    source: '/campaigns/current-state-analysis-user-experience-audit',
    destination: '/',
  },
  {
    source: '/campaigns/customer-insights-benchmark-survey',
    destination: '/',
  },
  {
    source: '/campaigns/customer-insights-journey-analytics',
    destination: '/',
  },
  {
    source: '/campaigns/cx',
    destination: '/',
  },
  {
    source: '/campaigns/cxstrategy',
    destination: '/',
  },
  {
    source: '/campaigns/innovation',
    destination: '/',
  },
  {
    source: '/campaigns/martech-assessment',
    destination: '/',
  },
  {
    source: '/campaigns/personalization',
    destination: '/',
  },
  {
    source: '/campaigns/product-insights-visualization-and-validation',
    destination: '/',
  },
  {
    source: '/campaigns/technology',
    destination: '/',
  },
  {
    source: '/campaigns/the-o3-difference',
    destination: '/',
  },
  {
    source: '/campaigns/uxuidesign',
    destination: '/',
  },
  {
    source: '/campaigns/web-accessibility-audit',
    destination: '/',
  },
  {
    source: '/careers',
    destination: '/about#careers',
  },
  {
    // via /careers → /about#careers
    source: '/careers/future-opportunities-with-o3',
    destination: '/about#careers',
  },
  {
    source: '/christine-sheller-speaking-overview',
    destination: '/',
  },
  {
    source: '/community-engagement',
    destination: '/about',
  },
  {
    source: '/conversing-with-the-future-an-interactive-chatgpt-experience',
    destination: '/perspectives',
  },
  {
    source: '/convert',
    destination: '/solutions',
  },
  {
    // via /solutions/web-digital-product → /solutions/conversion-rate-optimization-consultant
    source: '/data-analytics',
    destination: '/solutions',
  },
  {
    // via /solutions/web-digital-product → /solutions/conversion-rate-optimization-consultant
    source: '/digital-marketing-solutions',
    destination: '/solutions',
  },
  {
    source: '/engage',
    destination: '/solutions',
  },
  {
    source: '/enterprise-digital-products',
    destination: '/solutions',
  },
  {
    source: '/include',
    destination: '/solutions',
  },
  {
    source: '/industry/ecommerce',
    destination: '/work',
  },
  {
    source: '/innovate',
    destination: '/solutions',
  },
  {
    // via /solutions/digital-experience-consulting → /solutions/digital-experience-consulting-services
    source: '/innovation-programs',
    destination: '/solutions',
  },
  {
    source: '/insights',
    destination: '/perspectives',
  },
  {
    // via /careers → /about#careers
    source: '/join-our-team',
    destination: '/about#careers',
  },
  {
    source: '/labs',
    destination: '/solutions',
  },
  {
    source: '/labs/barista',
    destination: '/solutions',
  },
  {
    source: '/labs/innovation-workshops',
    destination: '/solutions',
  },
  {
    source: '/labs/lunchbot',
    destination: '/solutions',
  },
  {
    source: '/labs/moods',
    destination: '/solutions',
  },
  {
    source: '/labs/o3-barista',
    destination: '/ventures',
  },
  {
    source: '/labs/o3-lunchbot',
    destination: '/ventures',
  },
  {
    source: '/labs/o3-moods',
    destination: '/ventures',
  },
  {
    source: '/labs/partnering-to-experiment',
    destination: '/solutions',
  },
  {
    source: '/labs/poolytics',
    destination: '/solutions',
  },
  {
    source: '/labs/poops',
    destination: '/solutions',
  },
  {
    source: '/labs/roombot',
    destination: '/solutions',
  },
  {
    source: '/labs/taskbot',
    destination: '/solutions',
  },
  {
    source: '/labs/theme-music',
    destination: '/solutions',
  },
  {
    source: '/labs/vertex',
    destination: '/solutions',
  },
  {
    source: '/lunch-and-learn-with-o3-empower-your-team-with-ai-insights',
    destination: '/live',
  },
  {
    source: '/mike-gadsby-chief-innovation-officer',
    destination: '/about',
  },
  {
    // via /mike-gadsby-chief-innovation-officer → /about
    source: '/mike-gadsby-chief-innovation-officer-2',
    destination: '/about',
  },
  {
    source: '/news/1682-presents-the-venture-awards',
    destination: '/perspectives/1682-presents-the-venture-awards',
  },
  {
    source: '/news/1682-the-business-of-conference-innovation',
    destination: '/perspectives/1682-the-business-of-conference-innovation',
  },
  {
    source: '/news/1682-the-cant-miss-event-that-youre-probably-missing',
    destination: '/perspectives/1682-the-cant-miss-event-that-youre-probably-missing',
  },
  {
    source: '/news/2019-a-year-in-review',
    destination: '/perspectives/2019-a-year-in-review',
  },
  {
    source: '/news/2021-community-impact',
    destination: '/perspectives/2021-community-impact',
  },
  {
    source: '/news/3-considerations-for-running-an-empathy-lab',
    destination: '/perspectives/3-considerations-for-running-an-empathy-lab',
  },
  {
    source: '/news/3-customer-experience-trends-brands-need-to-pay-attention-to-now',
    destination: '/perspectives/3-customer-experience-trends-brands-need-to-pay-attention-to-now',
  },
  {
    source: '/news/3-essential-tips-for-product-innovation-expanded',
    destination: '/perspectives/3-essential-tips-for-product-innovation-expanded',
  },
  {
    source: '/news/3-tips-for-succeeding-in-product-innovation',
    destination: '/perspectives/3-tips-for-succeeding-in-product-innovation',
  },
  {
    source: '/news/5-digital-accessibility-myths-debunked',
    destination: '/perspectives/5-digital-accessibility-myths-debunked',
  },
  {
    // via /perspectives/6-tips-for-running-a-successful-innovation-workshop → /perspectives/innovation-workshops-o3
    source: '/news/6-tips-for-running-a-successful-innovation-workshop',
    destination: '/perspectives/innovation-workshops-o3',
  },
  {
    source: '/news/7-ways-to-use-chatbots-effectively-in-your-customer-experience',
    destination: '/perspectives/7-ways-to-use-chatbots-effectively-in-your-customer-experience',
  },
  {
    source: '/news/a11y-lunch-o3-world-and-accessibility',
    destination: '/perspectives/a11y-lunch-o3-world-and-accessibility',
  },
  {
    source: '/news/a11y-updates-certifications-devices-and-labs',
    destination: '/perspectives/a11y-updates-certifications-devices-and-labs',
  },
  {
    source: '/news/accessibility-no-mouse-day',
    destination: '/perspectives/accessibility-no-mouse-day',
  },
  {
    source: '/news/automating-workflows-and-rpa-how-to-streamline-work',
    destination: '/perspectives/automating-workflows-and-rpa-how-to-streamline-work',
  },
  {
    source: '/news/beth-perkins-on-employee-cycles-podcast',
    destination: '/perspectives',
  },
  {
    source: '/news/beth-perkins-speaks-with-indeed-about-exit-interviews',
    destination: '/perspectives',
  },
  {
    source: '/news/bi-annual-2022-state-of-the-ozone-gathering-recap',
    destination: '/perspectives/bi-annual-2022-state-of-the-ozone-gathering-recap',
  },
  {
    source: '/news/brian-crumley-o3-developer-greatest-hits-accomplishments-list',
    destination: '/perspectives/brian-crumley-o3-developer-greatest-hits-accomplishments-list',
  },
  {
    source: '/news/brian-crumleys-10-year-anniversary',
    destination: '/perspectives/brian-crumleys-10-year-anniversary',
  },
  {
    source: '/news/chief-innovation-officer-mike-gadsby-on-roadmapping',
    destination: '/perspectives/chief-innovation-officer-mike-gadsby-on-roadmapping',
  },
  {
    source: '/news/christine-sheller-reveals-how-to-create-a-skills-matrix',
    destination: '/perspectives/christine-sheller-reveals-how-to-create-a-skills-matrix',
  },
  {
    source: '/news/covid-19-ushers-in-new-outlook-on-hiring-remote-workers',
    destination: '/perspectives',
  },
  {
    source: '/news/creative-exchange-a-collaborative-virtual-design-thinking-series',
    destination: '/perspectives/creative-exchange-a-collaborative-virtual-design-thinking-series',
  },
  {
    source: '/news/cx-vs-ux-why-all-brands-need-a-strategic-approach',
    destination: '/perspectives/cx-vs-ux-why-all-brands-need-a-strategic-approach',
  },
  {
    source: '/news/defining-innovation-with-cliff-kuang-3-important-takeaways',
    destination: '/perspectives/defining-innovation-with-cliff-kuang-3-important-takeaways',
  },
  {
    source: '/news/design-predictions-that-will-guide-the-industry-in-2020',
    destination: '/perspectives/design-predictions-that-will-guide-the-industry-in-2020',
  },
  {
    source: '/news/design-slam-2020-the-accessibility-edition',
    destination: '/perspectives/design-slam-2020-the-accessibility-edition',
  },
  {
    source: '/news/designing-for-accessibility-improving-ux-for-everyone',
    destination: '/perspectives/designing-for-accessibility-improving-ux-for-everyone',
  },
  {
    source: '/news/drupal-migrations-are-they-unsustainable',
    destination: '/perspectives/drupal-migrations-are-they-unsustainable',
  },
  {
    source: '/news/drupal-owners-time-to-move-version-7-to-8',
    destination: '/perspectives/drupal-owners-time-to-move-version-7-to-8',
  },
  {
    source: '/news/ebook-accessibility-considerations-for-project-management-teams',
    destination: '/perspectives/ebook-accessibility-for-pm-teams',
  },
  {
    source: '/news/ebook-accessibility-for-pm-teams',
    destination: '/perspectives/ebook-accessibility-for-pm-teams',
  },
  {
    source: '/news/evolution-of-agile',
    destination: '/perspectives',
  },
  {
    source: '/news/front-end-development-standards-and-best-practices',
    destination: '/perspectives/front-end-development-standards-and-best-practices',
  },
  {
    source: '/news/gdpr-regulation-might-impact-your-website',
    destination: '/perspectives/gdpr-regulation-might-impact-your-website',
  },
  {
    source: '/news/happy-6-year-o3-anniversary-jay-forbes',
    destination: '/perspectives/happy-6-year-o3-anniversary-jay-forbes',
  },
  {
    source: '/news/how-the-world-of-work-changed-for-hr-and-talent-acquisition',
    destination: '/perspectives',
  },
  {
    source: '/news/how-to-bring-ux-designers-and-developers-together',
    destination: '/perspectives',
  },
  {
    source: '/news/in-the-news-3-essential-tips-for-product-innovation',
    destination: '/perspectives/in-the-news-3-essential-tips-for-product-innovation',
  },
  {
    source: '/news/in-the-news-beth-perkins-on-people-analytics-podcast',
    destination: '/perspectives',
  },
  {
    source: '/news/in-the-news-how-to-know-if-you-really-classify-as-a-small-business',
    destination: '/perspectives/in-the-news-how-to-know-if-you-really-classify-as-a-small-business',
  },
  {
    source: '/news/in-the-news-keith-scandone-on-the-agency-leadership-podcast',
    destination: '/perspectives/in-the-news-keith-scandone-on-the-agency-leadership-podcast',
  },
  {
    source: '/news/in-the-news-keith-scandone-on-the-digital-agency-show',
    destination: '/perspectives/in-the-news-keith-scandone-on-the-digital-agency-show',
  },
  {
    source: '/news/in-the-news-listen-to-keith-scandone-on-the-innovative-agency-podcast',
    destination: '/perspectives/in-the-news-listen-to-keith-scandone-on-the-innovative-agency-podcast',
  },
  {
    source: '/news/in-the-news-matter-of-trust-maintaining-customer-experience-during-ma',
    destination: '/perspectives/in-the-news-matter-of-trust-maintaining-customer-experience-during-ma',
  },
  {
    source: '/news/in-the-news-mike-gadsby-on-open-agency-podcast',
    destination: '/perspectives/in-the-news-mike-gadsby-on-open-agency-podcast',
  },
  {
    source: '/news/in-the-news-quartz-at-work-employers-have-a-lot-to-gain-from-letting-you-openly-look-for-a-new-job',
    destination: '/perspectives',
  },
  {
    source: '/news/in-the-news-the-problems-with-most-team-building-efforts-and-how-to-avoid-them',
    destination: '/perspectives/in-the-news-the-problems-with-most-team-building-efforts-and-how-to-avoid-them',
  },
  {
    source: '/news/inclusive-design-thinking-while-remote',
    destination: '/perspectives/inclusive-design-thinking-while-remote',
  },
  {
    source: '/news/innovation-day-2018-recap',
    destination: '/perspectives/innovation-day-2018-recap',
  },
  {
    source: '/news/innovation-day-2019-ptw19-recap',
    destination: '/perspectives/innovation-day-2019-ptw19-recap',
  },
  {
    source: '/news/innovation-in-a-time-of-crisis-adapting-and-evolving',
    destination: '/perspectives/innovation-in-a-time-of-crisis-adapting-and-evolving',
  },
  {
    source: '/news/introducing-mahesh-gaitonde-chief-digital-officer',
    destination: '/perspectives/introducing-mahesh-gaitonde-chief-digital-officer',
  },
  {
    source: '/news/introducing-open-operating-a-service-philadelphians-can-use-to-support-local-businesses',
    destination: '/perspectives/introducing-open-operating-a-service-philadelphians-can-use-to-support-local-businesses',
  },
  {
    source: '/news/josh-soldiers-breaks-down-conversational-experiences',
    destination: '/perspectives',
  },
  {
    source: '/news/josh-soldiers-releases-the-conversational-experience-playbook-part-2-in-ux-booth',
    destination: '/perspectives',
  },
  {
    source: '/news/keith-scandone-on-architecting-great-customer-experiences',
    destination: '/perspectives',
  },
  {
    source: '/news/keith-scandone-on-business-planning-in-pandemic-times',
    destination: '/perspectives/keith-scandone-on-business-planning-in-pandemic-times',
  },
  {
    source: '/news/keith-scandone-on-marketing-for-your-future',
    destination: '/perspectives/keith-scandone-on-marketing-for-your-future',
  },
  {
    source: '/news/keith-scandone-on-the-agency-profit-podcast',
    destination: '/perspectives/keith-scandone-on-the-agency-profit-podcast',
  },
  {
    source: '/news/keith-scandone-on-the-future-of-remote-and-in-office-teams',
    destination: '/perspectives/keith-scandone-on-the-future-of-remote-and-in-office-teams',
  },
  {
    source: '/news/keith-scandone-on-where-o3-is-going',
    destination: '/perspectives/keith-scandone-on-where-o3-is-going',
  },
  {
    source: '/news/keith-scandone-shares-what-todays-leaders-need-to-be-effective',
    destination: '/perspectives/keith-scandone-shares-what-todays-leaders-need-to-be-effective',
  },
  {
    source: '/news/mahesh-gaintinode-on-how-b2b-brands-can-move-to-a-d2c-model',
    destination: '/perspectives/mahesh-gaintinode-on-how-b2b-brands-can-move-to-a-d2c-model',
  },
  {
    source: '/news/meet-the-team-carroll-borodynko',
    destination: '/perspectives',
  },
  {
    source: '/news/meet-the-team-josh-friedman',
    destination: '/perspectives/meet-the-team-josh-friedman',
  },
  {
    source: '/news/meet-the-team-kelly-navari',
    destination: '/perspectives/meet-the-team-kelly-navari',
  },
  {
    source: '/news/meet-the-team-madeline-jensen',
    destination: '/perspectives/meet-the-team-madeline-jensen',
  },
  {
    source: '/news/mike-gadsby-on-how-to-weave-experiences-and-technology-together',
    destination: '/perspectives/mike-gadsby-on-how-to-weave-experiences-and-technology-together',
  },
  {
    source: '/news/mike-gadsby-on-the-future-of-ai-and-cx-in-todays-covid-19-world',
    destination: '/perspectives/mike-gadsby-on-the-future-of-ai-and-cx-in-todays-covid-19-world',
  },
  {
    source: '/news/mike-gadsby-on-the-smart-agency-podcast',
    destination: '/perspectives/mike-gadsby-on-the-smart-agency-podcast',
  },
  {
    source: '/news/mindshift',
    destination: '/perspectives/mindshift',
  },
  {
    source: '/news/mindshift-002',
    destination: '/perspectives/mindshift-002',
  },
  {
    source: '/news/mindshift-003',
    destination: '/perspectives/mindshift-003',
  },
  {
    source: '/news/mindshift-004',
    destination: '/perspectives/mindshift-004',
  },
  {
    source: '/news/mindshift-005',
    destination: '/perspectives/mindshift-005',
  },
  {
    source: '/news/mindshift-episode-1-recap-reactions',
    destination: '/perspectives/mindshift-episode-1-recap-reactions',
  },
  {
    source: '/news/mindshift-episode-2-top-takeaways',
    destination: '/perspectives/mindshift-episode-2-top-takeaways',
  },
  {
    source: '/news/movers-shakers-innovators-1682-moderator-spotlight',
    destination: '/perspectives/movers-shakers-innovators-1682-moderator-spotlight',
  },
  {
    source: '/news/movers-shakers-innovators-1682-speaker-spotlight-part-1',
    destination: '/perspectives/movers-shakers-innovators-1682-speaker-spotlight-part-1',
  },
  {
    source: '/news/movers-shakers-innovators-1682-speaker-spotlight-part-2',
    destination: '/perspectives/movers-shakers-innovators-1682-speaker-spotlight-part-2',
  },
  {
    source: '/news/o3-celebrates-17-years',
    destination: '/perspectives/o3-celebrates-17-years',
  },
  {
    source: '/news/o3-launches-new-student-mentorship-program',
    destination: '/perspectives/o3-launches-new-student-mentorship-program',
  },
  {
    source: '/news/o3-participates-in-greensgrow-clean-up-and-fundraiser',
    destination: '/perspectives/o3-participates-in-greensgrow-clean-up-and-fundraiser',
  },
  {
    source: '/news/o3-partner-peter-herzog-of-urvin-ai-on-ai-security',
    destination: '/perspectives/o3-partner-peter-herzog-of-urvin-ai-on-ai-security',
  },
  {
    source: '/news/o3-recognized-by-clutch-as-top-ux-consultancy',
    destination: '/perspectives/o3-recognized-by-clutch-as-top-ux-consultancy',
  },
  {
    source: '/news/o3-turns-13',
    destination: '/perspectives/o3-turns-13',
  },
  {
    source: '/news/o3-welcomes-michael-soileau-as-chief-executive-officer',
    destination: '/perspectives/o3-welcomes-michael-soileau-as-chief-executive-officer',
  },
  {
    source: '/news/o3-world-considered-top-15-digital-agency-in-philly',
    destination: '/perspectives/o3-world-considered-top-15-digital-agency-in-philly',
  },
  {
    source: '/news/o3-world-design-super-slam-recap',
    destination: '/perspectives/o3-world-design-super-slam-recap',
  },
  {
    source: '/news/o3cap-websites-milestones-and-blended-processes',
    destination: '/perspectives/o3cap-websites-milestones-and-blended-processes',
  },
  {
    source: '/news/one-designer-one-work-christine-sheller',
    destination: '/perspectives/one-designer-one-work-christine-sheller',
  },
  {
    source: '/news/our-director-of-people-and-culture-on-technical-ly-phillys-twij-show',
    destination: '/perspectives',
  },
  {
    source: '/news/ozone-ventures-update-see-philadelphias-newest-place-for-creators',
    destination: '/perspectives/ozone-ventures-update-see-philadelphias-newest-place-for-creators',
  },
  {
    source: '/news/personalization-creating-an-individualized-journey-for-your-customers',
    destination: '/perspectives/personalization-creating-an-individualized-journey-for-your-customers',
  },
  {
    source: '/news/philadelphia-urban-cowboys-x-o3',
    destination: '/perspectives/philadelphia-urban-cowboys-x-o3',
  },
  {
    source: '/news/philly-tech-week-accessibility-design-slam',
    destination: '/perspectives/philly-tech-week-accessibility-design-slam',
  },
  {
    source: '/news/preparing-for-ccpa-during-covid-19',
    destination: '/perspectives/preparing-for-ccpa-during-covid-19',
  },
  {
    source: '/news/project-spotlight-caron-treatment-centers-digital-transformation-in-addiction-treatment',
    destination: '/perspectives/project-spotlight-caron-treatment-centers-digital-transformation-in-addiction-treatment',
  },
  {
    source: '/news/recap-seerfest-2022',
    destination: '/perspectives/recap-seerfest-2022',
  },
  {
    source: '/news/second-annual-o3-a11y-design-slam',
    destination: '/perspectives/second-annual-o3-a11y-design-slam',
  },
  {
    source: '/news/slack-amazon-better-team-collaboration',
    destination: '/perspectives',
  },
  {
    source: '/news/state-of-the-ozone-recap',
    destination: '/perspectives/state-of-the-ozone-recap',
  },
  {
    source: '/news/strella-biotechnology-fruit-hacking-and-the-future-of-food',
    destination: '/perspectives/strella-biotechnology-fruit-hacking-and-the-future-of-food',
  },
  {
    source: '/news/superior-experiences-with-an-edge',
    destination: '/perspectives/superior-experiences-with-an-edge',
  },
  {
    source: '/news/the-cx-challenge-in-healthcare',
    destination: '/perspectives/the-cx-challenge-in-healthcare',
  },
  {
    source: '/news/the-journey-to-becoming-certified-professionals-in-accessibility',
    destination: '/perspectives/the-journey-to-becoming-certified-professionals-in-accessibility',
  },
  {
    source: '/news/the-path-to-personalization',
    destination: '/perspectives/the-path-to-personalization',
  },
  {
    source: '/news/there-is-no-change-where-there-is-no-action',
    destination: '/perspectives/there-is-no-change-where-there-is-no-action',
  },
  {
    source: '/news/three-trends-shaping-successful-digital-product-experiences',
    destination: '/perspectives/three-trends-shaping-successful-digital-product-experiences',
  },
  {
    source: '/news/tim-breslin-featured-on-tech-talks-daily-podcast',
    destination: '/perspectives',
  },
  {
    source: '/news/tim-breslin-on-how-teams-can-challenge-their-approach-to-digital-transformation',
    destination: '/perspectives',
  },
  {
    source: '/news/understand-customers-at-every-touchpoint',
    destination: '/perspectives/understand-customers-at-every-touchpoint',
  },
  {
    source: '/news/utm_sourceo3worldutm_mediumpartnerutm_campaignws_ww_partner_directutm_id7013a000001ryfvaaqutm_termo3world',
    destination: '/perspectives/utm_sourceo3worldutm_mediumpartnerutm_campaignws_ww_partner_directutm_id7013a000001ryfvaaqutm_termo3world',
  },
  {
    source: '/news/video-interview-tips-for-tech-job-candidates-managers-during-covid-19',
    destination: '/perspectives',
  },
  {
    source: '/news/want-to-donate-to-a-local-person-or-org-in-need-now-you-can-pay-it-phorward',
    destination: '/perspectives/want-to-donate-to-a-local-person-or-org-in-need-now-you-can-pay-it-phorward',
  },
  {
    source: '/news/watch-out-amazon-walmart-is-back-in-the-game-thanks-to-the-shopify-partnership',
    destination: '/perspectives/watch-out-amazon-walmart-is-back-in-the-game-thanks-to-the-shopify-partnership',
  },
  {
    source: '/news/watch-out-cx-industry-omnichannel-personalization-data-and-ai-are-here',
    destination: '/perspectives/watch-out-cx-industry-omnichannel-personalization-data-and-ai-are-here',
  },
  {
    source: '/news/webinar-recap-making-innovation-work-inside-your-organization',
    destination: '/perspectives/webinar-recap-making-innovation-work-inside-your-organization',
  },
  {
    source: '/news/webinar-recap-the-business-impact-of-creating-accessible-experiences',
    destination: '/perspectives/webinar-recap-the-business-impact-of-creating-accessible-experiences',
  },
  {
    source: '/news/webinar-recap-when-seo-meets-personalization',
    destination: '/perspectives/webinar-recap-when-seo-meets-personalization',
  },
  {
    source: '/news/weve-expanded-our-space',
    destination: '/perspectives/weve-expanded-our-space',
  },
  {
    source: '/news/what-brands-need-to-know-about-digital-accessibility',
    destination: '/perspectives/what-brands-need-to-know-about-digital-accessibility',
  },
  {
    source: '/news/whats-new-at-o3-january-2019-recap',
    destination: '/perspectives/whats-new-at-o3-january-2019-recap',
  },
  {
    source: '/news/whats-new-with-1682-speaker-and-full-website-announcement',
    destination: '/perspectives/whats-new-with-1682-speaker-and-full-website-announcement',
  },
  {
    // via /perspectives/why-1682-and-why-not-forge → /perspectives/innovation-conference
    source: '/news/why-1682-and-why-not-forge',
    destination: '/perspectives/innovation-conference',
  },
  {
    source: '/news/why-accessibility-shouldnt-be-an-afterthought',
    destination: '/perspectives/why-accessibility-shouldnt-be-an-afterthought',
  },
  {
    source: '/news/why-innovation-must-be-your-agencys-first-priority',
    destination: '/perspectives/why-innovation-must-be-your-agencys-first-priority',
  },
  {
    source: '/news/you-monitor-your-kids-behavior-why-wouldnt-you-monitor-your-customers',
    destination: '/perspectives/you-monitor-your-kids-behavior-why-wouldnt-you-monitor-your-customers',
  },
  {
    source: '/perspectives/6-tips-for-running-a-successful-innovation-workshop',
    destination: '/perspectives/innovation-workshops-o3',
  },
  {
    source: '/perspectives/ai-agents-charting-a-path-from-automation-to-intelligence',
    destination: 'https://www.o3xo.ai/insights/ai-agents-charting-a-path-from-automation-to-intelligence/',
  },
  {
    source: '/perspectives/ai-and-the-future-of-humanity-work-and-education',
    destination: 'https://www.o3xo.ai/insights/ai-and-the-future-of-humanity-work-and-education/',
  },
  {
    source: '/perspectives/ai-impact-on-finance-industry-disruption-generative-ai-finance-dynamics-human-ingenuity-ai-innovation',
    destination: 'https://www.o3xo.ai/insights/ai-impact-on-finance-industry-disruption-generative-ai-finance-dynamics-human-ingenuity-ai-innovation/',
  },
  {
    source: '/perspectives/ai-modern-enterprise-learnings',
    destination: 'https://www.o3xo.ai/insights/ai-modern-enterprise-learnings/',
  },
  {
    source: '/perspectives/ai-project-strategy-essential-considerations',
    destination: 'https://www.o3xo.ai/insights/ai-project-strategy-essential-considerations/',
  },
  {
    source: '/perspectives/ai-roi-beyond-efficiency',
    destination: 'https://www.o3xo.ai/insights/ai-roi-beyond-efficiency/',
  },
  {
    source: '/perspectives/codeday-philly-at-o3-world',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/decoding-openai-turmoil-o3-insights-ai-governance-industry-implications',
    destination: 'https://www.o3xo.ai/insights/decoding-openai-turmoil-o3-insights-ai-governance-industry-implications/',
  },
  {
    source: '/perspectives/from-ai-to-empathy-redefining-customer-care-for-the-future',
    destination: 'https://www.o3xo.ai/insights/from-ai-to-empathy-redefining-customer-care-for-the-future/',
  },
  {
    source: '/perspectives/gpt-4o-revolutionizing-ai-and-customer-experience',
    destination: 'https://www.o3xo.ai/insights/gpt-4o-revolutionizing-ai-and-customer-experience/',
  },
  {
    source: '/perspectives/how-ai-is-changing-the-way-we-build-software',
    destination: 'https://www.o3xo.ai/insights/how-ai-is-changing-the-way-we-build-software/',
  },
  {
    source: '/perspectives/insights-from-o3s-chief-innovation-officer-on-the-disruption-is-now-podcast',
    destination: 'https://www.o3xo.ai/insights/insights-from-o3s-chief-innovation-officer-on-the-disruption-is-now-podcast/',
  },
  {
    source: '/perspectives/is-ai-a-superhero-or-a-villain-mike-gadsby-explores-on-the-penji-podcast',
    destination: 'https://www.o3xo.ai/insights/is-ai-a-superhero-or-a-villain-mike-gadsby-explores-on-the-penji-podcast/',
  },
  {
    source: '/perspectives/join-us-at-innovation-day-on-may-5th',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/lessons-learned-three-takeaways-from-the-2017-dpm-summit',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/mike-gadsby-on-pacts-digital-phorum-podcast',
    destination: 'https://www.o3xo.ai/insights/mike-gadsby-on-pacts-digital-phorum-podcast/',
  },
  {
    source: '/perspectives/moving-beyond-the-initial-buzz-of-generative-ai-navigating-the-challenges-from-pilot-to-scale',
    destination: 'https://www.o3xo.ai/insights/moving-beyond-the-initial-buzz-of-generative-ai-navigating-the-challenges-from-pilot-to-scale/',
  },
  {
    source: '/perspectives/navigating-ai-landscape-o3-innovative-approach',
    destination: 'https://www.o3xo.ai/insights/navigating-ai-landscape-o3-innovative-approach/',
  },
  {
    source: '/perspectives/navigating-generative-ai-black-box-transparency-control',
    destination: 'https://www.o3xo.ai/insights/navigating-generative-ai-black-box-transparency-control/',
  },
  {
    source: '/perspectives/navigating-the-ai-revolution-a-recap-of-pact-tech-series-on-ai-in-fintech',
    destination: 'https://www.o3xo.ai/insights/navigating-the-ai-revolution-a-recap-of-pact-tech-series-on-ai-in-fintech/',
  },
  {
    source: '/perspectives/not-all-ai-is-safe-for-fintech',
    destination: 'https://www.o3xo.ai/insights/not-all-ai-is-safe-for-fintech/',
  },
  {
    source: '/perspectives/o3-world-expands-c-suite-leadership-team-invests-in-agency-growth',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/o3-world-recognized-as-best-places-to-work-in-philadelphia-4-years-in-a-row',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/o3s-accessibility-resources',
    destination: '/perspectives/digital-accessibility-resources',
  },
  {
    source: '/perspectives/o3xo-ai-consulting',
    destination: 'https://www.o3xo.ai/insights/o3xo-ai-consulting/',
  },
  {
    source: '/perspectives/project-management-protip-mnemonics',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/recapping-2017-agency-field-day',
    destination: '/perspectives',
  },
  {
    source: '/perspectives/revolutionizing-customer-experience-with-chatgpt-improving-cx',
    destination: '/perspectives/chatgpt-improving-cx',
  },
  {
    source: '/perspectives/revolutionizing-healthcare-a-deep-dive-into-o3s-ai-webinar',
    destination: 'https://www.o3xo.ai/insights/revolutionizing-healthcare-a-deep-dive-into-o3s-ai-webinar/',
  },
  {
    source: '/perspectives/revolutionizing-music-creation-suno-udio',
    destination: 'https://www.o3xo.ai/insights/revolutionizing-music-creation-suno-udio/',
  },
  {
    source: '/perspectives/revolutionizing-recall-how-ais-new-frontier-with-gemini-1-5-transforms-data-retention',
    destination: 'https://www.o3xo.ai/insights/revolutionizing-recall-how-ais-new-frontier-with-gemini-1-5-transforms-data-retention/',
  },
  {
    source: '/perspectives/rfp-automation-case-study',
    destination: 'https://www.o3xo.ai/insights/rfp-automation-case-study/',
  },
  {
    source: '/perspectives/suno-and-udio-the-latest-ai-for-creating-music',
    destination: 'https://www.o3xo.ai/insights/revolutionizing-music-creation-suno-udio/',
  },
  {
    source: '/perspectives/supercharging-sales-integrating-ai-into-your-sales-program',
    destination: 'https://www.o3xo.ai/insights/supercharging-sales-integrating-ai-into-your-sales-program/',
  },
  {
    source: '/perspectives/the-ai-hierarchy-of-needs-a-strategic-framework-for-businesses',
    destination: 'https://www.o3xo.ai/insights/the-ai-hierarchy-of-needs-a-strategic-framework-for-businesses/',
  },
  {
    source: '/perspectives/the-build-vs-buy-dilemma-making-smart-ai-investment-choices',
    destination: 'https://www.o3xo.ai/insights/the-build-vs-buy-dilemma-making-smart-ai-investment-choices/',
  },
  {
    source: '/perspectives/the-ceos-guide-to-ai-integration-10-common-questions-to-consider',
    destination: 'https://www.o3xo.ai/insights/the-ceos-guide-to-ai-integration-10-common-questions-to-consider/',
  },
  {
    source: '/perspectives/unleashing-the-power-of-data-and-ai-o3s-transformative-webinar',
    destination: '/perspectives/data-and-ai-o3s-transformative-webinar',
  },
  {
    source: '/perspectives/unlocking-future-video-generation-sora-ai',
    destination: 'https://www.o3xo.ai/insights/unlocking-future-video-generation-sora-ai/',
  },
  {
    source: '/perspectives/why-1682-and-why-not-forge',
    destination: '/perspectives/innovation-conference',
  },
  {
    source: '/perspectives/young-smart-local-mike-gadsby-ai-panel-talent',
    destination: 'https://www.o3xo.ai/insights/young-smart-local-mike-gadsby-ai-panel-talent/',
  },
  {
    source: '/service/content-strategy-copywriting',
    destination: '/solutions',
  },
  {
    // via /solutions-2 → /solutions
    source: '/services-solutions',
    destination: '/solutions',
  },
  {
    source: '/services/accessibility-as-a-service',
    destination: '/solutions',
  },
  {
    source: '/services/accessibility-audit',
    destination: '/solutions',
  },
  {
    source: '/services/accessibility-consulting-optimization',
    destination: '/solutions',
  },
  {
    source: '/services/advanced-technology-cms-audit',
    destination: '/solutions',
  },
  {
    source: '/services/ai-consulting',
    destination: 'https://www.o3xo.ai/',
  },
  {
    source: '/services/api-creation',
    destination: '/solutions',
  },
  {
    source: '/services/benchmark-surveys',
    destination: '/solutions',
  },
  {
    source: '/services/brand-audit',
    destination: '/solutions',
  },
  {
    source: '/services/content-management-solutions',
    destination: '/solutions',
  },
  {
    source: '/services/content-strategy',
    destination: '/solutions',
  },
  {
    source: '/services/conversion-rate-optimization',
    destination: '/solutions',
  },
  {
    source: '/services/custom-web-mobile-applications',
    destination: '/solutions',
  },
  {
    source: '/services/customer-journey-mapping',
    destination: '/solutions',
  },
  {
    source: '/services/data-analysis-benchmarking',
    destination: '/solutions',
  },
  {
    source: '/services/data-analytics-ai-consulting',
    destination: '/solutions',
  },
  {
    source: '/services/digital-products-applications',
    destination: '/',
  },
  {
    source: '/services/digital-strategy-innovation',
    destination: '/',
  },
  {
    source: '/services/ensuring-accessibility-in-higher-ed',
    destination: '/solutions',
  },
  {
    source: '/services/experience-design',
    destination: '/',
  },
  {
    source: '/services/innovation-strategy',
    destination: '/solutions',
  },
  {
    source: '/services/journey-mapping-workshops',
    destination: '/solutions',
  },
  {
    source: '/services/marketing-automation',
    destination: '/solutions',
  },
  {
    source: '/services/partners',
    destination: '/',
  },
  {
    // via /services/user-type-workshops → /services/user-type-workshop
    source: '/services/persona-development-workshops',
    destination: '/solutions',
  },
  {
    source: '/services/personalization-strategy',
    destination: '/solutions',
  },
  {
    source: '/services/software-development',
    destination: '/solutions',
  },
  {
    source: '/services/systems-integration',
    destination: '/solutions',
  },
  {
    source: '/services/technology-development',
    destination: '/',
  },
  {
    source: '/services/user-type-workshop',
    destination: '/solutions',
  },
  {
    source: '/services/user-type-workshops',
    destination: '/solutions',
  },
  {
    source: '/services/ux-audit',
    destination: '/solutions',
  },
  {
    source: '/services/video-production',
    destination: '/solutions',
  },
  {
    source: '/services/websites-ecommerce',
    destination: '/',
  },
  {
    source: '/sitecore',
    destination: '/solutions',
  },
  {
    source: '/solutions-2',
    destination: '/solutions',
  },
  {
    source: '/solutions/ai-solutions',
    destination: 'https://www.o3xo.ai/',
  },
  {
    // via /solutions/digital-experience-consulting → /solutions/digital-experience-consulting-services
    source: '/solutions/consulting',
    destination: '/solutions',
  },
  {
    source: '/solutions/conversion-rate-optimization-consultant',
    destination: '/solutions',
  },
  {
    source: '/solutions/digital-experience-consulting',
    destination: '/solutions',
  },
  {
    source: '/solutions/digital-experience-consulting-services',
    destination: '/solutions',
  },
  {
    source: '/solutions/solutions-ai-for-b2b-growth',
    destination: 'https://www.o3xo.ai/',
  },
  {
    source: '/solutions/web-digital-product',
    destination: '/solutions',
  },
  {
    source: '/speaking-engagement-opportunities',
    destination: '/about',
  },
  {
    source: '/statement-of-accessibility',
    destination: '/accessibility-statement',
  },
  {
    source: '/thank-you',
    destination: '/',
  },
  {
    source: '/thank-you-careers',
    destination: '/',
  },
  {
    source: '/transcend',
    destination: 'https://www.o3xo.ai/',
  },
  {
    source: '/ventures/fanup',
    destination: '/ventures',
  },
  {
    source: '/work/3bl-media',
    destination: '/work',
  },
  {
    // via /work/personalized-video → /work/ai-powered-personalization
    source: '/work/allied-pixel',
    destination: '/work/ai-powered-personalization',
  },
  {
    source: '/work/case-studies-ai-electrical-safety-e-hazard',
    destination: 'https://www.o3xo.ai/case-studies/e-hazard/',
  },
  {
    source: '/work/crane',
    destination: '/work',
  },
  {
    source: '/work/delivering-generative-ai-solution-legal-documents',
    destination: 'https://www.o3xo.ai/case-studies/fortune-500-insurance-provider/',
  },
  {
    source: '/work/personalized-video',
    destination: '/work/ai-powered-personalization',
  },
  {
    source: '/work/rfp-automation-3',
    destination: 'https://www.o3xo.ai/case-studies/global-tech-firm/',
  },
  {
    source: '/work/rfp-automation-o3',
    destination: 'https://www.o3xo.ai/case-studies/global-tech-firm/',
  },
  {
    source: '/wp-content/uploads/2023/01/BestEgg-casestudy3-6-1280x741',
    destination: '/work/best-egg',
  },
]

/** Fast membership test for the sitemap. */
export const REDIRECTED_PATHS: ReadonlySet<string> = new Set(
  GENERATED_REDIRECTS.map((r) => r.source),
)
