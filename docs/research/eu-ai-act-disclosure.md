# Research: EU AI Act disclosure duties for agency-produced marketing content

Researched 2026-08-15. Every source below was accessed on 2026-08-15.

The question behind this document: when a US agency (O3 World) uses Claude to draft content that a
client publishes on the client's marketing website, and that website reaches readers in the EU, what
does Regulation (EU) 2024/1689 actually require, of whom, and from when?

Primary sources, in the order they carry weight:

1. The consolidated text of Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744
   (the Digital Omnibus on AI), from EUR-Lex.
2. The Commission's **Guidelines on the implementation of the transparency obligations for certain
   AI systems under Article 50 of the AI Act**, adopted 20 July 2026. This is a 51-page document and
   it is the single most useful source for this question. It answers, by name and by worked example,
   the agency/client allocation and the marketing-copy question.
3. The Commission's Article 50 FAQ (last updated 24 July 2026) and the **Code of Practice on
   Transparency of AI-generated Content** (published 10 June 2026, assessed adequate 8-9 July 2026).
4. Anthropic's own help-centre article on marking.
5. Law-firm commentary, labelled as such wherever it is used.

The Guidelines are not binding law. They are the Commission's stated interpretation, and market
surveillance authorities and courts are not bound by them. They are nonetheless the best available
evidence of how the provision will be read, and on several points they are the only source that
addresses the question at all.

---

## Findings summary

**1. Scope.** The Regulation reaches a non-EU company through Article 2(1)(c), which applies it to
"providers and deployers of AI systems that have their place of establishment or are located in a
third country, where the output produced by the AI system is used in the Union." The Guidelines
narrow this in the deployer's favour and then take most of the narrowing back: a third-country
deployer is in scope "where the deployer itself foresees dissemination and use of the AI outputs in
the Union (i.e. by directing or authorising distribution within the Union, **including by posting
deep fakes on the globally accessible internet**)", but is not bound "where the content of the AI
system reaches audiences in the Union through channels that are unforeseeable and outside their
control." The carve-out is about unforeseeable *channels*, not about an unintended *audience*.
Publishing on a public website that anyone in the EU can read is the paradigm case of foreseeable
dissemination, not the exception to it. The honest reading: a US agency or client publishing a
public marketing site in English is very likely inside Article 2(1)(c) if any content it publishes
falls under Article 50(4) at all. The real filter is Article 50(4)'s subject-matter test, not
territorial scope. Genuinely unsettled: whether merely being readable from the EU, with no EU
targeting, is enough. The Guidelines' one example of foreseeable dissemination via the open internet
is about deep fakes, and the Commission has not restated it for text.

**2. Article 50 obligations.** Two different duties on two different parties. Article 50(2) binds
**providers** and is the machine-readable marking duty — this is Anthropic's obligation, and it is
what a watermark is for. Article 50(4), second subparagraph, binds **deployers** and requires
disclosure of "text which is published with the purpose of informing the public on matters of public
interest". Three cumulative criteria (published; informing the public; on a matter of public
interest), and two exceptions (law enforcement; human review or editorial control *plus* a natural or
legal person holding editorial responsibility). **Ordinary marketing copy is mostly out**, and the
Commission says so in terms. The Guidelines' list of text falling *outside* Article 50(4) includes
"AI-manipulated text that is part of a company's advertisement or product descriptions (not including
any claims related to e.g. health, consumer safety or sustainability)". The narrow yes: a
thought-leadership piece about an "economic, financial, political, scientific, or cultural
development that may be relevant subject of public debate" is squarely inside, and so are
sustainability claims, health claims, consumer-safety claims, and investor information on a listed
company's site. The dividing line runs through a typical agency's output, not around it.

**3. Roles.** Anthropic is the **provider** of Claude (Article 3(3)) — it develops the system and
places it on the market under its own name. The deployer (Article 3(4)) is whoever uses the system
"under its authority", and the Guidelines define that authority as "assuming responsibility over the
decision to deploy the system and over the manner of the actual use of the system (including its
outputs)" — explicitly not requiring technical control. Applied to an agency: **the agency is
normally the deployer**, because the agency decides that Claude will be used and how. The Guidelines
say so by counterexample: "a company that merely commissions an advertising agency to produce an
advertisement, without taking decisions and exercising control over whether and how the advertising
agency uses AI in the production process, is not a deployer." The client becomes a deployer, or a
concurrent one, the moment it decides whether AI is used, dictates how, or exercises control over the
output — which is what most client-side AI policies and approval workflows do. Publishing the content
does not, on its own, make the client a deployer; the Guidelines put pure disseminators outside the
definition. Distributor (Article 3(7)) is a red herring here: it concerns making an *AI system*
available on the Union market, not content. Where it is a judgement call: a client that mandates "you
may use AI, disclose it to us" is exercising control over whether AI is used and is arguably a
concurrent deployer; the Commission has not addressed a shared workflow of that shape.

**4. Fines.** Article 99(4)(g) puts "transparency obligations for providers and deployers pursuant to
Article 50" in the middle tier: administrative fines of up to **EUR 15 000 000 or, if the offender is
an undertaking, up to 3% of total worldwide annual turnover for the preceding financial year,
whichever is higher**. SMEs and (since the Omnibus) small mid-caps get the *lower* of the two.
Fines are levied by **national market surveillance authorities**, not by the Commission; the AI Office
has jurisdiction only where the same entity provides both the system and the underlying
general-purpose model, or where the system sits inside a designated VLOP/VLOSE. Chapter XII, which
contains Article 99, has applied since 2 August 2025, but there was nothing to fine under Article 50
until 2 August 2026. **No Article 50 enforcement action is known as of 2026-08-15.** That is
unsurprising for two reasons: the obligation is thirteen days old, and as of 17 June 2026 only 9 of
27 Member States had designated both a market surveillance authority and a notifying authority.

**5. Timeline.** Article 113: entry into force 1 August 2024; Chapters I-II (definitions,
prohibitions) from 2 February 2025; Chapter III Section 4, Chapter V (GPAI), Chapter VII, Chapter XII
(penalties) and Article 78 from 2 August 2025; the rest, **including Article 50, from 2 August 2026**;
Article 6(1) high-risk classification from 2 August 2027. Regulation (EU) 2026/1744 of 8 July 2026
(OJ 24 July 2026, in force 27 July 2026) left Article 50(1)-(5) untouched, amended Article 50(7) to
drop the implementing-act route in favour of a Commission adequacy assessment, and inserted a new
Article 111(4): providers of generative systems **placed on the market before 2 August 2026** have
until **2 December 2026** to comply with Article 50(2). That grace period is for providers only and
for the marking duty only. Deployers got nothing. On guidance: the Code of Practice on Transparency
of AI-generated Content was published **10 June 2026** and assessed adequate by the Commission on
8 July and by the AI Board on 9 July 2026; about 190 organisations had signed by end-July. The final
Article 50 Guidelines were adopted **20 July 2026**. Both landed less than two months before the
obligation bit.

**6. The watermark's legal status.** A provider-side statistical text watermark discharges the
**provider's** Article 50(2) duty and does nothing for the **deployer's** Article 50(4) duty. The
Commission is direct about this for deep fakes — "deployers cannot rely on the machine-readable
marking embedded in the content by the provider under Article 50(2) AI Act, since those markings are
not immediately clear and distinguishable for the natural persons exposed to the deep fake content" —
and states the same requirement for text by analogy: the label must be "clear and perceivable by
natural persons (e.g. visible or audible measures) without them needing to rely on any specific
technical tools or performing dedicated actions." A watermark you need an API to read is, by
definition, a technical tool. As to what is publicly known: Anthropic's help-centre article confirms
that Claude models launched on or after 2 August 2026 embed "an imperceptible watermark directly into
the text itself", that .svg/.png/.jpg files get C2PA-signed provenance metadata instead, that marking
applies worldwide across the API, Claude, Claude Code, Claude Cowork and Claude Tag and via AWS,
Google Cloud and Microsoft Foundry, and that **no detector is available yet**. Anthropic signed
Section 1 of the Code of Practice as a provider of both models and systems. A sharper point, and the
one the post is missing: **Anthropic marks more than the law asks it to.** Article 50(2) does not
apply "to the extent the AI systems perform an assistive function for standard editing or do not
substantially alter the input data" — grammar correction, spellchecking, minor stylistic polish and
translation are all named by the Guidelines as exempt. Anthropic marks all generated text anyway,
everywhere. So a Claude mark is not evidence that the content is AI-generated in the sense the
Regulation uses, and its absence is not evidence of anything at all.

**7. The agency/client allocation in practice.** The Regulation allocates roles by function, and
contracts cannot reallocate them. The Commission's one procedural instruction on multi-party chains
is Guidelines point 12: deployers "involved in complex content production and distribution value
chains should take proportionate measures to ensure that the labelling of the content they have
implemented pursuant to Article 50(4) AI Act is displayed in a clear and distinguishable manner for
the targeted and foreseeable audience at the point of first exposure in accordance with Article 50(5)
AI Act (e.g., **via contractual conditions with distributing partners**, user experience (UX) settings
and interfaces to be displayed)." Read into the agency case: if the agency is the deployer and the
client's CMS strips or buries the label, the agency is still on the hook, and the Commission's named
remedy is a contract term. Second concrete requirement, from the Code of Practice's Commitment 4:
non-media signatories relying on the editorial-responsibility exception must identify the natural or
legal person holding it "(name, role and contact details)", document the organisational measures
allocated to review, and **publish those contact details**. The Guidelines say the same: identity and
contact details "should be made publicly available on an easily findable location", e.g. a website's
terms and conditions. Nobody has published guidance on where in an agency/client relationship
editorial responsibility should sit. Law-firm commentary (Addleshaw Goddard, 31 July 2026) states the
governing principle: "Contracts can allocate day-to-day compliance responsibilities, they cannot
determine which party qualifies as the provider or deployer under the AI Act."

---

## 1. Territorial scope

### What the text says

Article 2(1):

> This Regulation applies to:
> (a) providers placing on the market or putting into service AI systems or placing on the market
> general-purpose AI models in the Union, irrespective of whether those providers are established or
> located within the Union or in a third country;
> (b) deployers of AI systems that have their place of establishment or are located within the Union;
> (c) providers and deployers of AI systems that have their place of establishment or are located in
> a third country, where the output produced by the AI system is used in the Union;

Recital 22 is looser than (c) in one respect and tighter in another. It gives the anti-circumvention
rationale, and it uses *intended*:

> To prevent the circumvention of this Regulation and to ensure an effective protection of natural
> persons located in the Union, this Regulation should also apply to providers and deployers of AI
> systems that are established in a third country, to the extent the output produced by those systems
> is intended to be used in the Union.

So the article says "is used" and the recital says "is intended to be used". Recitals do not override
enacting terms, but they guide interpretation, and the Commission has adopted the recital's reading.

### What the Guidelines say

Guidelines point 13, on deployers:

> Deployers fall within the scope of the transparency obligations in Article 50(3) and (4) AI Act if
> their place of establishment or location is within the Union, or if they are established or located
> in a third country where the output of the AI system is used in the Union. In the latter case, the
> transparency obligations apply to entities located or established outside the Union where the
> deployer itself foresees dissemination and use of the AI outputs in the Union (i.e. by directing or
> authorising distribution within the Union, including by posting deep fakes on the globally
> accessible internet). However, third country deployers are not bound by the transparency
> obligations where the content of the AI system reaches audiences in the Union through channels that
> are unforeseeable and outside their control.

Point 10, the parallel statement for providers:

> However, incidental, unforeseeable or unauthorised downstream use should not alone trigger the
> application of the obligations to such third country providers of interactive or generative AI
> systems that are not placed on the market or put into service in the Union […]

And a worked example at point 14 that puts a third-country company inside scope on the strength of
where its content is displayed:

> Similarly, a company established in a third country that uses an AI system to generate a deep fake
> of a celebrity featured in an advertisement displayed in the Union is also a deployer falling within
> the scope of the AI Act.

### Honest reading

The parenthetical "including by posting deep fakes on the globally accessible internet" is the
load-bearing phrase, and it cuts against the comfortable US reading. Posting to the open web is given
as an *example of foreseeing* EU dissemination, not as an example of the unforeseeable-channel
exception. The exception is about how content travels — someone else scraping, reposting,
syndicating — not about who happens to read a page you published yourself.

Two things this does not settle. First, the parenthetical is stated for deep fakes; whether the same
"globally accessible internet" logic applies to Article 50(4) text has not been restated. Second, the
usual Brussels-effect distinction between a site that is merely accessible from the EU and one that
targets EU markets — familiar from GDPR Article 3(2) and the consumer-contract case law — does not
appear in the Guidelines at all. The Commission neither adopted it nor rejected it. Anyone claiming
that a marketing site is out of scope because it does not target the EU is arguing by analogy to a
different instrument.

For a client whose marketing website "reaches multiple countries", including EU countries, the
scope question is not close: content aimed at readers in several countries is content whose EU
dissemination is foreseen. What keeps such a site mostly out of Article 50(4) is the subject-matter
test, not geography.

---

## 2. Article 50, paragraph by paragraph

### 50(2) — providers, machine-readable marking

> Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image,
> video or text content, shall ensure that the outputs of the AI system are marked in a
> machine-readable format and detectable as artificially generated or manipulated. Providers shall
> ensure their technical solutions are effective, interoperable, robust and reliable as far as this is
> technically feasible, taking into account the specificities and limitations of various types of
> content, the costs of implementation and the generally acknowledged state of the art, as may be
> reflected in relevant technical standards. This obligation shall not apply to the extent the AI
> systems perform an assistive function for standard editing or do not substantially alter the input
> data provided by the deployer or the semantics thereof, or where authorised by law to detect,
> prevent, investigate or prosecute criminal offences.

Two elements, both required: marking *and* detectability. Guidelines point 69: "For every marking
solution deployed, providers should ensure that corresponding means for detection are available."
Fulfilling only one does not discharge the duty.

The "standard editing" exception is defined at Guidelines point 90:

> Standard editing should be understood as the process of preparing existing content for publication
> or distribution (e.g., small edits to improve readability and grammar, quality and format) and does
> not involve generating new content. […] Editing goes beyond standard editing if the content is
> changed in a material way (substantive modifications, structural changes etc.) that affect its
> meaning, style or intent.

Named examples benefitting from the exception include "Grammar correction and spellchecking,
linguistic and minor stylistic polishing that do not change the substance, meaning, style or messaging
of text, AI-generated translations of text".

Guidelines point 68 also puts several output types outside 50(2) entirely: short sequences of numbers
or letters (single words, image captions, alt-text, UI labels), source code (including SDKs, SQL,
YAML, JSON, API definitions), machine-to-machine outputs, and intermediate outputs in closed-loop
production workflows.

### 50(4) — deployers, deep fakes and text

Second subparagraph, verbatim:

> Deployers of an AI system that generates or manipulates text which is published with the purpose of
> informing the public on matters of public interest shall disclose that the text has been artificially
> generated or manipulated. This obligation shall not apply where the use is authorised by law to
> detect, prevent, investigate or prosecute criminal offences or where the AI-generated content has
> undergone a process of human review or editorial control and where a natural or legal person holds
> editorial responsibility for the publication of the content.

Guidelines section 6.2.1 breaks the trigger into three elements:

- **Published**: "the text should be accessible by an indeterminate, fairly large number of unrelated,
  potential readers simultaneously and/or successively, whether or not against payment (e.g.
  subscriptions)". Not published: private correspondence, internal corporate networks, closed groups.
- **Informing the public**: "the text should intend to communicate knowledge, opinions or facts. By
  contrast, short texts which do not materially communicate knowledge, opinions or facts, cannot be
  deemed to inform the public."
- **On matters of public interest**: "matters […] relevant to society at large, whether at a local,
  national, Union or international level, and meriting public debate or scrutiny", covering "politics
  and democratic processes, public administration and services, the administration of justice and law
  enforcement, the protection of fundamental rights, public security, public health, environmental
  protection, consumer safety, and any economic, financial, political, scientific, or cultural
  development that may be relevant subject of public debate."

### Does ordinary marketing copy fall under 50(4)?

Mostly no. The Guidelines give explicit examples on both sides.

In scope, and requiring a label unless the human-review exception applies:

> - AI-generated summary of a human-authored article on a newspaper's website discussing a recent
>   decision by a town council.
> - AI-manipulated parts of a lifestyle-website article comparing the effects of various diets on a
>   particular disease in middle-aged women.
> - AI-manipulated corporate reports published on a listed company's website containing investor
>   information.
> - AI-generated message on a meteorological institute's social media profile warning citizens about
>   stormy weather and related precautionary measures.

Out of scope:

> - AI-generated fantasy novels.
> - AI-manipulated text that is part of a company's advertisement or product descriptions (not
>   including any claims related to e.g. health, consumer safety or sustainability).
> - News summary generated by a chatbot that is only available to the user that prompted the chatbot.
> - AI-manipulated text by a consultant for a client advice regarding measures to be taken for
>   regulatory compliance with applicable legislation.

The second exclusion is the one that matters for an agency. A product page, a campaign landing page, a
description of a service — out. The parenthetical is the whole game: health claims, consumer-safety
claims and sustainability claims drag advertising copy back in. So does the "lifestyle website"
example, which is not a newspaper and not a regulated publisher; a brand's blog post comparing diets
would be treated the same way. And the "economic, financial, political, scientific, or cultural
development" branch of the public-interest list catches most of what an agency would call thought
leadership.

Note also that the consultant-advice exclusion turns on *published*, not on subject matter. Advice
delivered to one client is not published. Publish the same analysis on a blog and it can flip.

### 50(5) — form and timing, for all of paragraphs 1 to 4

> The information referred to in paragraphs 1 to 4 shall be provided to the natural persons concerned
> in a clear and distinguishable manner at the latest at the time of the first interaction or exposure.
> The information shall conform to the applicable accessibility requirements.

### 50(7) as amended by the Omnibus

The original paragraph let the Commission approve codes of practice by implementing act, or specify
common rules if a code was inadequate. Regulation (EU) 2026/1744 replaced it: the Commission "shall
encourage and facilitate the drawing up of codes of practice" and, "taking utmost account of the
opinion of the Board, shall assess whether adherence to those codes of practice is adequate to ensure
compliance with the obligations". The recital explains that the codes have "limited legal effect, and
in particular do not grant a presumption of conformity". The Code of Practice is therefore evidence of
compliance, not a safe harbour.

---

## 3. Roles: provider, deployer, distributor

Article 3 definitions, verbatim:

> (3) 'provider' means a natural or legal person, public authority, agency or other body that develops
> an AI system or a general-purpose AI model or that has an AI system or a general-purpose AI model
> developed and places it on the market or puts the AI system into service under its own name or
> trademark, whether for payment or free of charge;
>
> (4) 'deployer' means a natural or legal person, public authority, agency or other body using an AI
> system under its authority except where the AI system is used in the course of a personal
> non-professional activity;
>
> (7) 'distributor' means a natural or legal person in the supply chain, other than the provider or the
> importer, that makes an AI system available on the Union market;
>
> (8) 'operator' means a provider, product manufacturer, deployer, authorised representative, importer
> or distributor;

**Anthropic is a provider.** It develops Claude and places it on the market under its own name.
Article 2(1)(a) applies to it irrespective of establishment. Its Article 50 duties are 50(1)
(interaction disclosure), 50(2) (marking and detection) and 50(5) (form).

**"Under its authority" is the deployer test.** Guidelines point 12:

> The 'authority' over an AI system should be understood as assuming responsibility over the decision
> to deploy the system and over the manner of the actual use of the system (including its outputs). It
> does not necessarily require technical control over the operation of the AI system, so long as the
> deployer takes the decision for what purposes and how to use the AI system (including in
> decentralised workflows and group corporate structures).

**Employees and contractors are not separate deployers.** Guidelines point 14:

> Where the deployer of an AI system is a legal person under whose authority the system is used (e.g.
> an advertising company), the individual employees that act under the instructions and under the
> control of that legal person (e.g. digital animators, web designers, content creators, journalists)
> should not be considered as separate deployers for that system. A legal person remains a deployer
> even if it involves third parties (e.g. contractors, freelancers) in the operation of the system on
> its behalf and under its responsibility and control.

The Commission chose "an advertising company" as its illustration of a deployer. That is not an
accident, and it is the closest the guidance comes to naming an agency.

**Commissioning an agency does not, by itself, make the client a deployer.** Guidelines, immediately
after point 14:

> By contrast, a company that merely commissions an advertising agency to produce an advertisement,
> without taking decisions and exercising control over whether and how the advertising agency uses AI
> in the production process, is not a deployer.

**Both can be deployers at once, and one entity can be provider and deployer at once.** Point 15:

> Operators (e.g. providers and deployers) may fulfil more than one role concurrently in relation to
> an AI system.

**Pure dissemination is not deployment.** Point 16:

> By contrast, other actors (such as providers of hosting services, including online platforms, or
> broadcasters) whose role is limited to disseminating or transmitting AI-generated or manipulated
> content created by third parties, or who receive or are exposed to AI-generated or manipulated
> content without having authority over the use of the AI system for the purpose of the AI content
> generation or manipulation, are not deployers within the meaning of the AI Act.

And point 17 adds that labelling content does not make you a deployer: "the mere fact that an actor
labels content or uses labelled content does not mean that the latter qualifies as a 'deployer'".

### Applied to the agency/client case

| Fact pattern | Deployer, on the Commission's reasoning |
| --- | --- |
| Client briefs O3; O3 decides to use Claude; client neither knows nor controls | O3 alone |
| Client requires AI use, or approves a specific tool, or reviews and directs AI-generated drafts | Both, concurrently |
| Client forbids AI; O3 uses it anyway | O3 alone (and a contract problem) |
| O3 delivers finished copy; client publishes it verbatim on its own site | O3 is the deployer; the client is closer to point 16's disseminator, but it is publishing under its own name, which point 16 does not squarely address |
| Client's in-house team uses Claude; O3 only edits | Client |

The fourth row is the genuine judgement call. Point 16 is drafted for hosting services and
broadcasters — intermediaries carrying someone else's content. A client publishing agency-produced
copy under its own masthead is not an intermediary in that sense, but it also has no authority over
the AI system. The Commission has not addressed it. The practical consequence is that the agency
cannot assume the duty transfers on delivery, and the client cannot assume it stayed with the agency.

Distributor is not a role in this chain. It concerns making an *AI system* available on the Union
market, which neither party does.

---

## 4. Penalties

Article 99(4), as amended:

> Non-compliance with any of the following provisions related to operators or notified bodies, other
> than those laid down in Articles 5, shall be subject to administrative fines of up to EUR 15 000 000
> or, if the offender is an undertaking, up to 3 % of its total worldwide annual turnover for the
> preceding financial year, whichever is higher:
> […]
> (g) transparency obligations for providers and deployers pursuant to Article 50.

For comparison: Article 5 prohibited-practice breaches sit at EUR 35 000 000 or 7%; supplying
incorrect or misleading information to authorities sits at EUR 7 500 000 or 1%.

Article 99(6) and the Omnibus-inserted 99(6a) reverse the "whichever is higher" rule for SMEs,
start-ups and small mid-caps: for them the fine is capped at whichever of the two is **lower**. A US
agency below the SME thresholds is not automatically covered — the AI Act's SME definition follows the
EU recommendation, and applying it to a non-EU undertaking is untested.

Article 99(7) lists the mitigating and aggravating factors, including "the degree of responsibility of
the operator taking into account the technical and organisational measures implemented by it" and "the
intentional or negligent character of the infringement". A documented review process is directly
relevant to the size of a fine even where it does not establish the exemption.

**Who levies.** Commission FAQ, 24 July 2026:

> Compliance with the rules will mainly be enforced by national competent market surveillance
> authorities. The AI Office has a limited role in monitoring and enforcement, since it is only
> competent for AI systems that are built on general-purpose AI models, if the same entity provides
> the system and the model, or if the AI system is integrated into a very large online search engine or
> very large online platform designated under the Digital Services Act. The European Data Protection
> Supervisor will enforce the rules vis-a-vis AI systems used by the EU institutions, bodies and
> agencies.

**When penalties became applicable.** Article 113(b) brought Chapter XII (Articles 99-100) into
application on **2 August 2025**, a year before Article 50. Penalties have been on the books longer
than the duty they now attach to.

**Enforcement activity as of 2026-08-15: none found.** No Article 50 enforcement action, formal
proceeding or fine has been reported. Two structural reasons to expect a slow start. The obligation is
thirteen days old. And the enforcement machinery is incomplete: the AI Act Explorer's tracker of
national implementation (last updated 17 June 2026) records 9 Member States with both a market
surveillance authority and a notifying authority designated, 12 partially designated, and 6 with
neither — against an Article 70 deadline of 2 August 2025.

---

## 5. Timeline and guidance status

Article 113, as amended:

- **1 August 2024** — entry into force.
- **2 February 2025** — Chapters I and II (scope, definitions, AI literacy, prohibited practices). The
  Omnibus carved out two newly added prohibitions in Article 5, which apply from 2 December 2026.
- **2 August 2025** — Chapter III Section 4, Chapter V (general-purpose AI models), Chapter VII
  (governance), Chapter XII (penalties, except Article 101), and Article 78.
- **2 August 2026** — the Regulation generally, **including Article 50**.
- **2 December 2026** — Article 111(4), inserted by the Omnibus: providers of generative systems placed
  on the market before 2 August 2026 must comply with Article 50(2) by this date.
- **2 August 2027** — Article 6(1) and the corresponding high-risk obligations (as re-lettered by the
  Omnibus).

The new Article 111(4), verbatim:

> Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image,
> video or text content, that have been placed on the market before 2 August 2026 shall take the
> necessary steps in order to comply with Article 50(2) by 2 December 2026.

Its recital 38 gives the rationale: "To allow sufficient time for providers of generative AI systems
subject to the marking obligations laid down in Article 50(2) of Regulation (EU) 2024/1689 to adapt
their practices within a reasonable time without disrupting the market, it is appropriate to introduce
a transitional period of four months for providers who have already placed their systems on the market
before the 2 August 2026."

Read it for what it is: a provider-only, 50(2)-only extension. Deployers, and Article 50(4), got no
grace period.

The Digital Omnibus itself: **Regulation (EU) 2026/1744 of the European Parliament and of the Council
of 8 July 2026 amending Regulations (EU) 2024/1689, (EU) 2018/1139 and (EU) 2023/1230 as regards the
simplification of the implementation of harmonised rules on artificial intelligence**. Published in the
Official Journal 24 July 2026; in force 27 July 2026.

### Guidance status as of 2026-08-15

**Commission Guidelines on Article 50** — adopted **20 July 2026**, 51 pages. Not binding. The only
source that addresses agency/client allocation and the marketing-copy question.

**Code of Practice on Transparency of AI-generated Content** — published **10 June 2026**, drafted
through a multi-stakeholder process with two working groups. Section 1 covers providers (Article 50(2)
and (5)); Section 2 covers deployers (Article 50(4) and (5)). Assessed adequate by the Commission on
8 July 2026 and by the AI Board on 9 July 2026. About 190 organisations had signed by end-July 2026;
the deadline to be listed among initial signatories was 27 July 2026, 18:00 CEST. Section 1 signatories
include Anthropic, Google, Meta, Microsoft, Mistral, OpenAI, Cohere, Aleph Alpha, Black Forest Labs
and Synthesia; Section 2 signatories named by the Commission include Bulgari, Fastweb, Getty Images,
Iberdrola, Lenovo and Lufthansa. Adherence is voluntary and, post-Omnibus, confers no presumption of
conformity. The FAQ's framing: non-signatories "will have to demonstrate compliance through
alternative adequate means" and "may be subject to more requests for information".

**Relationship to watermarking standards.** The Code is technique-agnostic. Section 1's Measure 1.1
contemplates watermarks, metadata (C2PA-style), fingerprinting and logging, and says reliance on
fingerprinting or logging alone is insufficient. Measure 3.4(c) sets the interoperability deadline:

> Signatories will implement an interoperability solution for their detection mechanisms by
> 2 February 2027 by implementing one or more of the following:

with four routes — (i) a public interoperable industry-standard access method for routing detection
queries; (ii) "a publicly readable signpost or other interoperable mechanism in the AI-generated or
manipulated content that will signal to the public which detection solution to use"; (iii) a shared
consortium detection service; (iv) "another interoperability solution that achieves interoperability
between Signatories comparable to the solutions above."

Detection access, Sub-measure 2.1.1: "Signatories will make the detection solution available free of
charge", with a narrow paid exception for signatories under 1,000,000 monthly users facing
high-volume requests, and unconditional free access "to competent market surveillance authorities and
other regulators, law enforcement authorities, media, fact-checkers, trusted flaggers, independent
researchers, educational and research institutions, and civil society organisations."

But Sub-measure 2.1.2 contains a carve-out specific to text that is easy to miss:

> In their detection solution, Signatories may restrict access to detection mechanisms associated to
> watermarking techniques for free-form text to the extent that they have a lower level of reliability
> and robustness and that they may produce misleading or low-confidence results. However, the results
> of such detection mechanisms may still provide valuable information to verified expert end-users with
> a legitimate need […] Therefore, Signatories will ensure that access for these expert end-users is
> granted subject to appropriate access controls and safeguards. Any restriction to the access will be
> limited in time until more reliable and robust detection mechanisms have emerged […]

So the Code permits text-watermark detection to be limited to verified expert users indefinitely,
"limited in time" only by the state of the art. This is not confined to the optional forensic
detection mechanism in Measure 2.2 — it applies to ordinary free-form text watermark detection. The
general public's access to a Claude text detector is, under the Code, discretionary.

### What the Code asks of deployers (Section 2)

Section 2 applies only to signatories acting as deployers of deep fakes or of "text published with the
purpose of informing the public on matters of public interest, without human review or editorial
control and where no natural or legal person holds editorial responsibility for the publication".

Placement for text, Sub-measure 1.2.2(f):

> For published text, Signatories will place the icon or equivalent label, for example above or at the
> top of the text, near the headline of the text, or in the colophon at the beginning of the text, as
> long as placement is clear, consistent, and distinguishable for the end-user. Where appropriate,
> Signatories may label only that part of the text which is AI-generated or manipulated.

Commitment 4 covers the human-review route. Media service providers within the meaning of the European
Media Freedom Act may rely on existing editorial procedures. Everyone else:

> All other Signatories, including those without such review or editorial procedures, commit to
> establish, adapt, or maintain appropriate policies for human review or editorial control prior to
> publication and that a natural or legal person holds editorial responsibility for the publication.
> These internal policies may rely on existing processes, will be proportionate to the deployer's size
> and resources, and will include at least the following elements:
> a) The identification of the natural or legal person with editorial responsibility (name, role and
> contact details);
> b) An overview of the concrete organisational measures as well as human resources, allocated to
> ensure adequate human review or editorial control is performed and editorial responsibility is
> assumed before publication of the published text. This does not entail having to document individual
> instances of human review or editorial control over individual text publications.

Note the last sentence: per-article review logs are explicitly not required. A named person, a written
policy, and published contact details are.

---

## 6. The human-review exception, in detail

Two cumulative conditions (Guidelines point 133): human review or editorial control, **and** a natural
or legal person holding editorial responsibility.

**Human review** (point 134):

> Human review refers to the deliberate examination of the substance of the content by one or more
> natural persons possessing relevant knowledge and professional judgement pertaining to the subject
> matter under scrutiny (e.g. academic peer review or professional validation chains). **Fact-checking
> the accuracy of the content is a minimum requirement that should be part of that review.** Editorial
> control refers to the control exercised in practice by a responsible editorial entity (e.g. an
> editor-in-chief) over the content having the authority to approve, alter or reject the substance of
> the text based on substantive grounds (incl. fact-checking of information and ensuring the
> trustworthiness of sources).

The emphasis is added. The Commission FAQ omits the fact-checking sentence; the Guidelines have it,
and it is a floor, not a suggestion.

**What does not count** (point 135):

> Superficial, solely formal or procedural checks (e.g. spell-checking or grammatical correction), the
> mere existence of an editorial policy, automated review processes or cursory editorial approval
> without substantive engagement by the human reviewer or the editorial entity, cannot fulfil the
> conditions for human review or editorial control for the purposes of this exception.

"The mere existence of an editorial policy" and "automated review processes" are in the FAQ's version
only implicitly. Both matter: an AI reviewing AI does not qualify.

**The sequencing rule** (point 136), which is the most operationally significant sentence in the
section and appears in no summary of it:

> Where AI systems are used to modify, supplement, or reformulate content following editorial sign-off,
> the resulting content must be treated as AI-generated or manipulated for the purposes of Article 50(4)
> AI Act. Any substantive AI intervention occurring after the human review or editorial control process
> has taken place will therefore cause the exception to become void.

A last-minute AI rewrite of a headline after sign-off voids the exemption for the piece.

**Editorial responsibility** (point 138):

> This entails that said person must hold the ultimate legal responsibility over the publication of the
> content, including the human review or editorial control (e.g. an individual, editorial board, or the
> publishing company). To ensure public accountability and trust, and in line with existing media
> professional standards, the identity and contact details of the legal person, the natural person or
> the function with editorial responsibility should be made publicly available on an easily findable
> location (if not yet otherwise available). This can happen online through e.g. a website's terms and
> conditions or other user-facing legal information.

Worked examples that qualify include "AI-generated sustainability reports published on a listed
company's website having undergone human review by professionals in relevant functions (e.g.
compliance)" and "AI-supported translation of a human-written article whereby the translation has
undergone human review" — neither is a newsroom. Examples that fail include "AI-generated articles
that are reviewed and edited by another AI system and where a human editor performs a mere
superficial, grammatical check before publication."

---

## 7. The watermark

### What Anthropic says

From the help-centre article, in Anthropic's own words:

> Anthropic has signed the EU AI Act's Article 50(2) Code of Practice on Transparency of AI-Generated
> Content, as a provider of both generative AI models and generative AI systems.

> **New models will mark AI-generated content from day one.** Claude models launched in the EU on or
> after August 2, 2026 will support machine-readable marking at launch. Generated text will carry
> embedded watermarks, and generated files will include digitally signed provenance metadata where
> supported.

> **Marking works everywhere you use Claude.** Marks will apply to output from supported Claude models
> across Claude Platform (API), Claude, Claude Code, Claude Cowork, and Claude Tag, and wherever Claude
> is offered, worldwide.

> When a supported Claude model generates text, it weaves an imperceptible watermark directly into the
> text itself. You won't see it, and it doesn't change the meaning, quality, or readability of Claude's
> response. Because the watermark is part of the text, it will travel with the text when it's copied
> and pasted elsewhere, and may persist through some editing. Watermarking will be applied at the model
> level […]

> We're also working to enable users and other third parties to detect Claude's embedded watermarks and
> provenance metadata. […] We'll share details on detection mechanisms in forthcoming technical
> documentation.

Limitations, verbatim:

> A detected mark provides a signal that content was processed by Claude, but is not fully conclusive.
> […] Claude may not be the original author. People often use Claude to proofread, translate,
> summarize, or convert files. The output can carry a Claude mark even if the underlying ideas, text,
> or data originated from another source; The content may have changed after Claude processed it.

> Lack of a detected mark doesn't mean the content wasn't AI-generated or processed. […] It was
> generated by a model released before marking was supported; The text has been heavily edited,
> paraphrased, translated, or mixed into other writing; The passage is very short, leaving too little
> text for a reliable signal; A file's metadata was stripped through format conversion, re-saving,
> screenshots, or other means […]

And, addressed directly to anyone in the position this document is about:

> If you deploy Claude in your own product, you should independently assess what Article 50 requires of
> your products and services. Consistent with our commitments under the EU Code, our goal is to support
> you in meeting your own transparency obligations […]

The article is dated only "Updated this week" (as at 2026-08-15). Press coverage dates the announcement
to 11 August 2026.

Note the internal inconsistency in Anthropic's own text: the commitments section says "Claude models
launched **in the EU** on or after August 2, 2026", the coverage section says "Claude models launched
on or after August 2, 2026". The broader reading matches the worldwide-application claim elsewhere in
the article.

### Does the watermark discharge anyone's Article 50 duty?

It discharges **Anthropic's**, partly. Article 50(2) requires marking *and* detectability; the
detection half is not yet delivered, and Anthropic says technical documentation is forthcoming. Under
Section 1 of the Code, which Anthropic signed, the interoperability deadline is 2 February 2027.

It does **nothing** for a deployer's Article 50(4) duty. Guidelines point 117, on deep fakes:

> Labelling or disclosure methods applied in accordance with Article 50(4), first subparagraph, AI Act
> should be understandable and perceivable by natural persons (e.g. with visible or audible labels),
> without them needing to rely on any specific technical tools or performing dedicated actions.
> Therefore, deployers cannot rely on the machine-readable marking embedded in the content by the
> provider under Article 50(2) AI Act, since those markings are not immediately clear and
> distinguishable for the natural persons exposed to the deep fake content.

For text, point 132 states the same requirement without repeating the "cannot rely" sentence:

> As required for deep fakes, labelling or disclosure methods (including disclaimers) applied in
> accordance with Article 50(4), second subparagraph, AI Act should also be clear and perceivable by
> natural persons (e.g. visible or audible measures) without them needing to rely on any specific
> technical tools or performing dedicated actions.

The Commission FAQ's flat statement — "deployers cannot simply rely on the machine-readable marking
embedded in the content by the provider under Article 50(2) of the AI Act to fulfil their disclosure
obligation" — sits in the deepfake answer, not the text answer. The conclusion is the same either way,
but anyone quoting the FAQ sentence as being *about text* is quoting it out of its section.

### The point nobody is making

Article 50(2) does not require marking where the system "perform[s] an assistive function for standard
editing or do[es] not substantially alter the input data provided by the deployer or the semantics
thereof". The Guidelines put grammar correction, spellchecking, minor stylistic polish, translation
and format conversion squarely inside that exception.

Anthropic marks all generated text anyway, worldwide, at the model level. So the mark is not
coextensive with the Regulation's own notion of AI-generated content. A piece of prose can carry a
Claude mark and be, on the Commission's analysis, not AI-generated content at all for Article 50
purposes. The mark answers "did Claude touch this?"; the law asks "was this substantively generated,
and did a competent person examine it?". Those are different questions with different answers, and the
gap between them is where the interesting writing is.

---

## Genuinely unsettled

Precisely located, in descending order of how much it matters to an agency:

1. **Who is the deployer when an agency drafts and a client publishes.** The Guidelines answer the
   easy end (the client who merely commissions is not a deployer; the agency that decides to use AI is)
   and leave the middle. A client that approves the tool, sets an AI policy, or edits AI-generated
   drafts is exercising some control over "whether and how" AI is used. Nothing says how much control
   flips the role, and nothing addresses the client that publishes agency copy under its own name
   without touching the tooling.

2. **Whether the "globally accessible internet" reasoning extends from deep fakes to text.**
   Guidelines point 13 gives open-web posting as its example of a third-country deployer foreseeing
   EU dissemination, but does so in a deep-fake parenthetical. There is no parallel statement for
   Article 50(4) text.

3. **Whether merely-accessible differs from targeted.** The GDPR Article 3(2) targeting analysis has
   no analogue in the AI Act text or Guidelines. The Commission neither imported it nor ruled it out.

4. **How much AI involvement makes text "AI-generated or manipulated" for 50(4).** Section 4.2.1 and
   4.3 of the Guidelines define this for the *provider's* 50(2) duty via the standard-editing exception.
   Article 50(4) has no equivalent exception in its own text, and the Guidelines do not say whether the
   50(2) standard-editing threshold carries across. A human-written article that Claude restructured is
   plainly in; a human-written article Claude proofread is plainly out of 50(2) but arguably still
   "manipulated" for 50(4). This is unresolved and it is the ambiguity most likely to matter in practice.

5. **Whether a non-EU undertaking gets the SME fine cap.** Article 99(6) refers to SMEs including
   start-ups; the AI Act adopts the EU SME definition, and its application to a US company has not been
   tested.

6. **Whether "public interest" swallows industry commentary.** The list includes "any economic,
   financial, political, scientific, or cultural development that may be relevant subject of public
   debate" and the Guidelines add that "matters that may be considered to be of public interest can
   evolve over time and across contexts." A B2B post about AI regulation is in. A B2B post about a
   design system probably is not. There is no line and there will not be one until an authority draws
   it.

7. **Whether enforcement will be meaningfully available.** Nine of twenty-seven Member States had both
   required authorities designated as of 17 June 2026. A duty applicable everywhere and enforceable in
   a third of the Union is a different practical proposition from the one the fine number implies.

8. **The detector question.** Anthropic has not shipped detection and the Code lets it restrict text
   detection to verified expert users. Whether the public ever gets a Claude text detector is a
   commercial and technical decision, not a legal requirement.

---

## Claims in the live post, checked

The live insight is `071cfb32-c38d-49c3-ae8a-1ff5b4783d0a` in Sanity project `naorcr6k`, dataset
`production`. Checked against the sources above.

**Holds up:**

- Article 50 applied from 2 August 2026. Correct (Article 113).
- The 50(2)/50(4) provider/deployer split. Correct.
- The three cumulative criteria for 50(4), and the Commission's public-interest list. Correct, quoted
  accurately from the FAQ.
- Deployers cannot rely on provider marking; disclosure must reach a person at first exposure without
  technical tools. Correct in substance, though the FAQ sentence quoted sits in the deepfake answer;
  the equivalent for text is Guidelines point 132.
- The Digital Omnibus grace period: four months, providers only, 50(2) only, to 2 December 2026, with
  no deployer grace period. Correct — and now citable to primary source (Regulation (EU) 2026/1744,
  new Article 111(4)) rather than to Gibson Dunn.
- The human-review exception and the Commission's description of it. Correct.
- EUR 15 million or 3% of worldwide turnover, whichever is higher, enforced by national market
  surveillance authorities. Correct (Article 99(4)(g)).
- Anthropic's limitations list, and the reading that a mark means "processed by Claude", not "written
  by Claude". Correct, quoted accurately.
- The Code of Practice's 2 February 2027 interoperability deadline and its four routes. Correct
  (Measure 3.4(c)).
- Forensic detection is optional and may be restricted to verified expert users. Correct (Measure 2.2,
  Sub-measure 2.1.2).

**Contradicted or overstated:**

1. **"The deployer is any professional user publishing the output, which is you."** This is the post's
   central legal claim and it is wrong as stated. The deployer is whoever uses the AI system under its
   authority — the party that decides whether and how AI is used. Publishing is neither necessary nor
   sufficient. Guidelines point 16 puts actors "whose role is limited to disseminating or transmitting
   AI-generated or manipulated content created by third parties" outside the definition, and the
   commissioning counterexample puts a client who merely hires an agency outside it too. For an agency
   audience this is not a quibble: it inverts who the post's advice is addressed to.

2. **"That is wide enough to hold a great deal of ordinary commentary."** True, but the post never
   reaches the Commission's explicit exclusion of "AI-manipulated text that is part of a company's
   advertisement or product descriptions", nor the health/consumer-safety/sustainability carve-back
   inside it. The post's checklist item ("A product page is usually out. A point of view on your
   industry is usually in") is the right instinct with no citation behind it, when the Commission
   states it directly.

3. **"Brussels wrote off the watermark as a way of telling your reader anything, months before the
   watermark shipped."** The FAQ was last updated 24 July 2026 and the Guidelines were adopted 20 July
   2026 — about three weeks before the 11 August announcement, not months. Only the Code of Practice
   (10 June 2026) is two months earlier. "Weeks" is the accurate word.

4. **"Article 50 ... has nothing to do with the watermark."** Half true and the half that is false is
   load-bearing. Article 50(2) is precisely what the watermark exists for; Anthropic says so in its own
   first sentence. It is 50(4) that has nothing to do with it. The post's own later paragraphs make the
   correct distinction, so this is an early overstatement rather than a real error.

5. **"Enforced by national market surveillance authorities across 27 member states."** As of 17 June
   2026, nine Member States had designated both required authorities, twelve partially, six neither.
   "Across 27 member states" describes the design, not the state of play.

6. **"How Claude's mark works is inference, because Anthropic has not published the algorithm."**
   Correct as to Anthropic's own documentation, which names no algorithm. But multiple secondary
   sources (TechTimes 11 Aug, and several outlets citing an Anthropic FAQ dated 14 Aug 2026) report
   that Anthropic identified the scheme as a version of Google DeepMind's SynthID-Text. **Sources
   conflict**; Search Engine Journal's coverage of the same announcement explicitly says no algorithm
   was named. The help-centre article, as retrieved on 2026-08-15, does not name one. If the post keeps
   the inference framing it should note that reporting says otherwise.

7. **"Signatories have to make detection accessible and free to end users, platforms, fact-checkers,
   researchers and regulators."** Nearly right, with an important omission. Sub-measure 2.1.1 does
   require free availability, and names that list for unrestricted free access. But Sub-measure 2.1.2
   separately permits signatories to **restrict access to text watermark detection specifically** —
   not only forensic detection — to verified expert users, on reliability grounds, for as long as the
   state of the art justifies it. The post attributes the expert-user restriction to forensic detection
   alone. The broader restriction is the stronger version of the post's own argument.

**Could not verify:**

- **"Every Claude model launched on or after August 2, 2026 marks the text it writes."** Anthropic's
  article says both "launched in the EU on or after August 2, 2026" and "launched on or after August 2,
  2026" in different sections. The post follows the broader phrasing, which is consistent with the
  worldwide-application claim, but Anthropic's own text is not self-consistent.
- **"So one organization can currently read a signature being written into a growing share of the
  world's text."** Anthropic never states that it can detect its own marks. It is a reasonable
  inference from a watermarking scheme with an unreleased detector, but it is an inference.
- Claims in the post about Google I/O, SynthID in Search and Chrome, the ETH Zurich SynthID probing
  results, the Kirchenbauer paper, and model-collapse research were outside this brief and were not
  re-verified here.

**Missing, and worth adding:**

- Guidelines point 136: substantive AI intervention *after* editorial sign-off voids the exemption.
  This is the sharpest operational rule in the whole section and it appears nowhere in the post.
- Guidelines point 138 and Code Commitment 4: the person with editorial responsibility must be
  **named and their contact details published**. The post's checklist says "write it down somewhere
  that survives that person leaving"; the actual requirement is to publish it.
- Guidelines point 12: a deployer in a distribution chain must ensure the label survives downstream,
  and the Commission's named mechanism is "contractual conditions with distributing partners". For an
  agency this is the concrete deliverable.
- The 50(2) standard-editing exception, and the fact that Anthropic marks well beyond it.

---

## Sources

All accessed 2026-08-15.

**Primary — legislation**

- Regulation (EU) 2024/1689 (Artificial Intelligence Act), consolidated OJ text.
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202401689
- Regulation (EU) 2026/1744 of 8 July 2026 (Digital Omnibus on AI), OJ 24 July 2026.
  https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202601744

**Primary — Commission / AI Office**

- Guidelines on the implementation of the transparency obligations for certain AI systems under
  Article 50 of the AI Act, adopted 20 July 2026 (PDF, 51 pp).
  https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems
  (direct PDF: https://ec.europa.eu/newsroom/dae/redirection/document/131215)
- Transparency obligations under Article 50 of the AI Act — FAQ, last updated 24 July 2026.
  https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- Code of Practice on Transparency of AI-generated Content, published 10 June 2026 (PDF, 38 pp).
  https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content
  (direct PDF: https://ec.europa.eu/newsroom/dae/redirection/document/129555)
- Strong backing for the Code of Practice on Transparency of AI-generated Content (signatory counts).
  https://digital-strategy.ec.europa.eu/en/news/strong-backing-code-practice-transparency-ai-generated-content

**Primary — Anthropic**

- How Claude marks AI-generated content, Claude Help Center.
  https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content

**Secondary — trackers**

- EU AI Act Explorer, national implementation plans tracker, last updated 17 June 2026.
  https://artificialintelligenceact.eu/national-implementation-plans/

**Commentary — law firms and press (labelled as such; used only where flagged in the text above)**

- Addleshaw Goddard, "AI transparency under the AI Act: what businesses need to know before 2 August
  2026", 31 July 2026 — source for the contracts-cannot-reallocate-roles point.
  https://www.addleshawgoddard.com/en/insights/insights-briefings/2026/technology/ai-transparency-ai-act-what-businesses-need-know-before-2-august-2026/
- Cooley, "EU AI Act: Transparency Obligations Take Effect 2 August 2026", 3 August 2026.
  https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026
- Reed Smith, "Transparency obligations for AI-generated content: The Code of Practice adequacy
  decision and the final EU Commission Guidelines on Article 50 AI Act" — source for the 8/9 July 2026
  adequacy dates.
  https://www.reedsmith.com/our-insights/blogs/viewpoints/102nbz0/transparency-obligations-for-ai-generated-content-the-code-of-practice-adequacy/
- Search Engine Journal, "Anthropic To Mark Claude Text & Files Under EU AI Act Code", 11 August 2026 —
  reports that no algorithm was named.
  https://www.searchenginejournal.com/anthropic-claude-watermarks-eu-ai-act-code/585355/
- TechTimes, "Claude Now Watermarks Text Everywhere", 11 August 2026 — reports the SynthID-Text
  identification. Conflicts with the above.
  https://www.techtimes.com/articles/323873/20260811/claude-now-watermarks-text-everywhere-mark-proves-processing-not-authorship.htm

**Not a lawyer, not legal advice.** The Guidelines and the Code of Practice are interpretive
instruments, not law, and the readings above of unsettled points are readings.
