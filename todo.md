# FEMSIDER - Project TODO

## Core Features
- [x] Dark theme with FEMSIDER aesthetic (#0f0f0f background, red/magenta accents)
- [x] User authentication with role-based access (admin/creator/subscriber)
- [x] Age verification system
- [x] Video upload system with S3 storage
- [x] Video player with streaming support
- [x] Creator profiles with customizable subscription pricing
- [x] Subscription payment system (CCBill/Segpay integration placeholder)
- [x] Affiliate program with multi-tier commission tracking
- [x] Creator analytics dashboard
- [x] Content moderation tools

## Pages
- [x] Landing page (hero, features, CTA)
- [x] Login/Register pages
- [x] Age verification gate
- [x] Video feed/browse page
- [x] Video detail/player page
- [x] Creator profile page
- [x] Creator dashboard (upload, analytics, earnings)
- [x] Subscriber dashboard (subscriptions, favorites)
- [x] Admin dashboard (moderation, users, analytics)
- [x] Settings page

## Database
- [x] Users table with roles
- [x] Videos table
- [x] Subscriptions table
- [x] Affiliate tracking table
- [x] Earnings/transactions table
- [x] Age verification records table

## Updates
- [x] Změnit 90% na 88% pro tvůrce
- [x] Změnit "Nejnižší" na "Nejvyšší" a zvýraznit
- [x] Implementovat víceúrovňový (multi-tier) affiliate systém (4 úrovně)

## Affiliate Dashboard & Gamifikace
- [x] Dashboard pro affiliate síť - vizualizace sítě doporučení a výdělků
- [x] Žebříček nejúspěšnějších tvůrců (leaderboard)
- [x] Systém odznaků a ocenění pro affiliate partnery
- [x] Databázové schéma pro odznaky
- [x] Backend API pro leaderboard a odznaky
- [x] Frontend komponenty pro affiliate dashboard

## Affiliate Marketing Tools
- [x] Sdílecí tlačítka pro sociální sítě (Twitter, Facebook, Telegram, WhatsApp)
- [x] Sekce s propagačními materiály (bannery, texty)
- [x] E-mailové notifikace při získání provize
- [x] E-mailové notifikace při získání odznaku

## QR kód, Bannery a Přehled odkazů
- [x] QR kód s affiliate odkazem v promo materiálech
- [x] Grafické bannery z poskytnutých obrázků (Yourfemalesideplatform.png, FEMSIDER.png)
- [x] Sekce s přehledem všech odkazů a jejich výkonnosti
- [x] Rozšířit text o "...for your VIP content"

## UTM, A/B Testování a Výplaty
- [x] UTM parametry pro affiliate odkazy (source, medium, campaign)
- [x] Sledování a analýza UTM parametrů v dashboardu
- [x] A/B testování bannerů s variantami
- [x] Statistiky výkonnosti jednotlivých variant bannerů
- [x] Systém pro výplatu provizí
- [x] Nastavení platebních metod (PayPal, bankovní převod)
- [x] Historie výplat a žádostí o výplatu
- [x] Minimální částka pro výplatu

## Hero Sekce Grafika
- [x] Přidat grafiku do hero sekce na landing page

## YouTube Integrace
- [x] Databázové schéma pro YouTube kanály a importovaná videa
- [x] Google/YouTube OAuth přihlašování (připraveno)
- [x] Import videí z YouTube kanálu (vložením odkazu)
- [x] Import miniatur a metadat (název, popis, tagy)
- [x] Synchronizace statistik z YouTube
- [x] Pokročilé statistiky a grafy (lepší než YouTube)
- [x] AI generování miniatur (3 varianty návrhů)
- [x] A/B testování miniatur s měřením proklikovosti
- [x] Stránka pro správu YouTube kanálu a importu
- [x] Propojení YouTube videí s rozšířenými verzemi na FEMSIDER

## Newsfeed, Zprávy a AI Chatbot
- [x] Databázové schéma pro příspěvky, komentáře, lajky a zprávy
- [x] Newsfeed stránka s příspěvky od sledovaných tvůrců
- [x] Vytváření příspěvků s textem a obrázky
- [x] Lajkování příspěvků a videí
- [x] Komentáře pod příspěvky a videa
- [x] Systém přímých zpráv mezi uživateli
- [x] Konverzace a historie zpráv
- [x] Real-time notifikace o nových zprávách
- [x] AI chatbot pro tvůrce
- [x] Tipy na zlepšení obsahu od AI
- [x] Generování návrhů miniatur přes AI

## Video Recreate/Extend System
- [x] Databázové schéma pro video projekty a AI analýzu
- [x] Import videa přes odkaz nebo přímé nahrání
- [x] AI analýza videa - přepis scénáře do promptů
- [x] Detekce klíčových scén (líbací scény atd.)
- [x] Generování screenshotů z časové osy (4 varianty)
- [x] Výběr a uložení preferovaného screenshotu
- [x] Integrace text-to-video modelů (Hailuo AI, VEO 3, WAN 2.6)
- [x] Generování 6s rozšířených scén
- [x] UI pro Video Recreate Studio
- [x] Možnost vytvořit remake nebo sequel videa

## UI Vylepšení
- [x] Hero sekce - zeslabit růžové záření a zesvětlit pozadí
- [x] Stín k nadpisu FEMSIDER pro lepší čitelnost
- [x] Parallax efekt v hero sekci při scrollování
- [x] Nahrávání vlastních videí do Video Recreate Studia
- [x] Integrace WAN 2.6 API pro generování video scén (MiniMax Hailuo-02)
- [x] Push notifikace pro zprávy a komentáře

## Nové funkce - Notifikace a Sdílení
- [x] Notifikační zvoneček v záhlaví s počtem nepřečtených
- [x] Automatický polling stavu generování videí
- [x] Zobrazení hotových videí uživatelům
- [x] Sdílení videí na Facebook
- [x] Sdílení videí na Twitter/X
- [x] Sdílení videí na Instagram
- [x] Sdílení videí na TikTok

## Video Přehrávač
- [x] Modální okno s video přehrávačem pro náhled před sdílením
- [x] Ovládací prvky (play/pause, hlasitost, fullscreen)
- [x] Integrace s tlačítkem sdílení

## TG/TF Transformation Šablony
- [x] Šablony scénářů (Sister's Exchange, Wishing to be Her, Hell's Life Saga atd.)
- [x] Přednaštavené prompty pro AI generování TG/TF videí
- [x] Kategorie a tagy pro TG/TF obsah
- [x] UI pro výběr šablon v Video Recreate Studiu
- [x] Změna textu "tisícům" na "k mnoha" a nadpisu na "Připraven začít vydělávat svou vášní?"

## Vylepšení šablon a galerie
- [x] Náhledové obrázky pro každou TG/TF šablonu (12 obrázků)
- [x] Automatické generování scénářů z vybraných šablon
- [x] Galerie hotových videí pro inspiraci uživatelů

## Galerie a Chatbot vylepšení
- [x] Odkaz na galerii v hlavní navigaci
- [ ] Nahrávání vlastních videí do galerie
- [ ] Systém hodnocení (hvězdičky) pod videa
- [ ] Komentáře pod videa v galerii
- [ ] Perzistentní paměť pro chatbota (ukládání konverzací)
- [ ] RAG systém pro chatbota (kontextové odpovědi z databáze)
- [x] Načteno 60 videí z YouTube kanálu @FEMSIDER
- [ ] Importovat YouTube videa do databáze
- [ ] Redesign homepage jako Patreon-style profil (membership tiers, community posts)
- [x] Hero sekce - nadpis FEMSIDER 100% průhledný, posunout popis a tlačítko níže

## Interactive Video Experience Features

### Database Schema
- [x] Přidat timestamp sloupec do comments tabulky
- [x] Vytvořit videoReactions tabulku (userId, videoId, reactionType, timestamp)
- [x] Přidat indexy pro rychlé dotazy na timestamp

### Backend API
- [x] Endpoint pro vytvoření timestamped comment
- [x] Endpoint pro získání comments podle timestamp range
- [x] Endpoint pro přidání emoji reakce na konkrétní timestamp
- [x] Endpoint pro získání všech reakcí pro video
- [x] Endpoint pro získání reakcí podle timestamp range

### Frontend - Video Player
- [x] Interaktivní timeline s indikátory komentářů a reakcí
- [x] Hover preview komentářů na timeline
- [x] Automatické zobrazení komentářů při dosažení timestamp
- [x] Emoji reaction picker s timestamp capture
- [x] Vizuální "heat map" reakcí na timeline

### Frontend - Comments UI
- [x] Timestamped comment input s aktuálním časem videa
- [x] Click-to-seek na timestamp v komentáři
- [x] Filtrování komentářů podle timestamp
- [x] Sorting komentářů (chronologicky vs. podle timestamp)

### Testing
- [x] Unit testy pro timestamped comments API
- [x] Unit testy pro reactions API
- [x] Integration test video player s timeline
- [x] Test performance při velkém množství komentářů/reakcí


## Platform Expansion - Crossdresser/Femboy Integration

### Monetization Plan
- [x] Vytvořit detailní monetizační strategii
- [x] Definovat premium tiers a pricing
- [x] Navrhnout affiliate program strukturu
- [x] Plán pro dating/social features monetizaci

### Database Schema
- [x] Přidat kategorie pro crossdresser/femboy obsah
- [x] Rozšířit user profiles o nové atributy
- [x] Vytvořit tabulky pro dating/matching features

### Crossdresser Community Section
- [x] Vytvořit Crossdresser stránku s galeriemi
- [x] Implementovat makeover tutorials sekci
- [x] Přidat fashion/style guides
- [x] Dating/social features UI

### Femboy Hub Section
- [x] Vytvořit Femboy Hub stránku
- [x] Style inspiration galerie
- [x] Creator profiles showcase
- [x] Community forums

### Navigation & Homepage
- [x] Aktualizovat navigaci pro nové sekce
- [x] Redesign homepage pro rozšířený koncept
- [x] Přidat category filtering

## User Profile, Photo Gallery & Community Forum

### User Profile Showcase
- [x] Profilová stránka s transformation showcase (before/after)
- [x] Editovatelné bio, zájmy a sociální odkazy
- [x] Galerie vlastních transformací s popisky
- [x] Achievement/badge display na profilu
- [x] Follow/unfollow systém na profilu

### Dynamic Photo Gallery
- [x] Upload fotek s drag & drop
- [x] Kategorizace fotek (transformation, fashion, makeup, lifestyle)
- [x] Like/heart systém na fotky
- [x] Komentáře pod fotkami
- [x] Lightbox pro prohlížení fotek
- [x] Filtrování a řazení galerie

### Community Forum / Discussion Board
- [x] Kategorie diskuzí (TG/TF, Crossdressing, Femboy, Advice, Off-topic)
- [x] Vytváření nových témat/threadů
- [x] Odpovědi na témata s citacemi
- [x] Upvote/downvote systém
- [x] Pinned/sticky témata
- [x] Moderační nástroje (lock, delete, move)

### Backend & Routing
- [x] DB schéma pro forum threads a replies
- [x] DB schéma pro photo gallery
- [x] tRPC endpointy pro všechny nové funkce
- [x] Registrace nových routes v App.tsx
- [x] Unit testy pro nové endpointy

## Real-time Chat, Seed Data & Verified Profiles

### Seed Data pro Fórum
- [x] Vytvořit výchozí kategorie fóra (TG/TF, Crossdressing, Femboy, Advice, Off-topic)
- [x] Vytvořit ukázkové příspěvky a odpovědi
- [x] Seed script pro automatické naplnění databáze

### WebSocket Real-time Chat
- [x] WebSocket server setup na Express
- [x] Real-time notifikace o nových odpovědích ve fóru
- [x] Live chat widget ve fóru
- [x] Online uživatelé indikátor
- [x] Typing indicator

### Verified Profiles
- [x] Přidat verified sloupec do users tabulky
- [x] Verified badge komponenta (checkmark icon)
- [x] Zobrazení verified badge na profilu a ve fóru
- [x] Admin endpoint pro udělení verified statusu
- [x] Žádost o ověření profilu (verification request)

## Push Notifications, Moderation Dashboard & Gamification

### Push Notifications
- [x] DB schéma pro notifikace (notifications tabulka)
- [x] Backend endpointy pro notifikace (list, markRead, markAllRead)
- [x] Automatické notifikace při odpovědi na téma
- [x] @mention detekce a notifikace
- [x] Notification bell s počtem nepřečtených v headeru

### Moderation Dashboard
- [x] Admin stránka pro správu verification requestů
- [x] Reportování obsahu (příspěvky, komentáře, fotky)
- [x] Admin přehled reportovaného obsahu
- [x] Akce: schválit, zamítnout, smazat, banovat

### Gamification System
- [x] DB schéma pro reputaci a odznaky
- [x] Reputační body za akce (post, reply, upvote, like)
- [x] Systém ranků (Newcomer, Member, Contributor, Expert, Legend)
- [x] Odznaky za milníky (první post, 100 upvotes, verified, atd.)
- [x] Zobrazení ranku a odznaků na profilu a ve fóru
- [x] Leaderboard stránka s žebříčkem reputace
- [x] Seed script pro badge definitions
- [x] Content report systém (submit, review, resolve, dismiss)
- [x] User management v admin panelu (role change, ban)
- [x] 100 unit testů prošlo

## Rank/Badges in Forum, Weekly Digest & Affiliate Gamification

### Rank & Badges in Forum
- [x] Zobrazení ranku a odznaků vedle jména uživatele u každého příspěvku ve fóru
- [x] Zobrazení ranku a odznaků vedle jména uživatele u každé odpovědi ve fóru

### Weekly Digest Notification
- [x] Backend endpoint pro generování weekly digest notifikace
- [x] Souhrn nových bodů, odznaků a pozice na leaderboardu

### Affiliate Gamification Integration
- [x] Bonus body za doporučení nových uživatelů (referral)
- [x] Zobrazení reputačních bodů v affiliate dashboardu
- [x] Propojení affiliate výkonnosti s gamifikačním systémem

## Homepage Redesign - Conversion Optimization

- [x] Locked content preview (blurred thumbnails with lock icon)
- [x] Stronger CTA flow pro sledující a platící uživatele
- [x] Vylepšení pricing cards s urgency a social proof
- [x] Content teaser gallery s blur efektem
- [x] Lepší hero section s video preview

## Social Proof, A/B Testing & Stripe Checkout

### Social Proof Notification Widget
- [x] Backend endpoint pro nedávné registrace/nákupy
- [x] Frontend toast widget "Petr z Prahy se právě připojil"
- [x] Rotace notifikací s animací slide-in/slide-out
- [x] Zobrazení pouze nepřihlášeným uživatelům

### A/B Testing CTA Buttons
- [x] A/B test schema v DB (variant, impressions, clicks, conversions)
- [x] Backend endpointy pro tracking a reporting
- [x] Frontend hook pro přiřazení varianty a tracking kliků
- [x] Různé varianty CTA na homepage (text, barva, urgency)

### Stripe Checkout Integration
- [x] Products/prices definice v products.ts
- [x] Checkout session endpoint pro každý tier
- [x] Webhook handler pro payment events
- [x] Propojení pricing cards s Stripe checkout
- [x] Success/cancel redirect stránky

## Subscriptions Page, Welcome Email & Forgot Password

### /subscriptions Page
- [x] Stránka s potvrzením úspěšného nákupu (success state)
- [x] Přehled aktivních předplatných s detaily (tier, cena, datum obnovení)
- [x] Možnost zrušení předplatného
- [x] Historie plateb
- [x] Upgrade/downgrade mezi tiers

### Welcome Email
- [x] Automatický uvítací e-mail po registraci (welcome notifikace)
- [x] Průvodce platformou (klíčové funkce)
- [x] Nabídka zkušebního předplatného
- [x] Personalizovaný obsah podle zájmů

### Forgot Password
- [x] Formulář pro zadání e-mailu (Account Recovery stránka)
- [x] Google OAuth recovery + kontakt na podporu
- [x] Account Recovery stránka s FAQ a možnostmi
- [x] N/A - OAuth systém (bez hesel)
- [x] N/A - OAuth systém (bez hesel)

## Onboarding Wizard

- [x] DB: přidat onboardingCompleted flag na users tabulku
- [x] Backend: endpoint pro kontrolu a dokončení onboardingu
- [x] Frontend: OnboardingWizard komponenta s kroky (Welcome, Procházet obsah, Fórum, Gamifikace, Affiliate, Předplatné)
- [x] Animace a progress bar mezi kroky
- [x] Integrace do App.tsx (trigger po prvním přihlášení)
- [x] Skip/přeskočit možnost
- [x] Testy pro onboarding flow (18 testů, celkem 183)

## Onboarding Improvements (Admin Reset, Personalization, Analytics)

- [x] Admin panel: tlačítko pro reset onboardingu vybraného uživatele
- [x] Backend: adminResetOnboarding endpoint (admin only)
- [x] Personalizovaná doporučení po dokončení onboardingu (homepage sekce)
- [x] Backend: endpoint pro personalizovaná doporučení na základě aktivity
- [x] Onboarding analytics: tracking step drop-off (který krok uživatelé přeskačují)
- [x] Onboarding analytics: completion rate, avg steps completed
- [x] Admin panel: onboarding analytics dashboard (Onboarding tab)
- [x] DB: onboardingEvents tabulka pro tracking kroků
- [x] Testy pro nové funkce (22 testů, celkem 205)

## Email Marketing, Onboarding A/B Test & Stripe Guide

### SendGrid Email Integration
- [ ] SendGrid npm package install a konfigurace
- [ ] SENDGRID_API_KEY secret v env
- [ ] Email helper funkce (sendEmail wrapper)
- [ ] Welcome email template (HTML) po registraci
- [ ] Weekly digest email template s body/stats
- [ ] Backend endpoint pro ruční odeslání weekly digest
- [ ] Fallback na in-app notifikaci pokud SendGrid selže

### Onboarding A/B Test (Step Ordering)
- [ ] DB: onboardingVariant pole na users tabulce
- [ ] Dvě varianty pořadí kroků (A: standard, B: Subscription jako 2. krok)
- [ ] Backend: přiřazení varianty při prvním onboardingu
- [ ] Frontend: OnboardingWizard načítá pořadí kroků z varianty
- [ ] Tracking konverzí (kdo z variant B koupil předplatné)
- [ ] Admin panel: výsledky A/B testu onboardingu

### Stripe Setup Guide & Checkout Verification
- [ ] Stránka /stripe-setup s průvodcem pro claim sandbox
- [ ] Odkaz na claim URL v admin panelu
- [ ] Vizuální checklist pro Stripe aktivaci (test → live)
- [ ] Test checkout flow validace (ověřit že webhook funguje)
- [ ] Testy pro email, A/B test a Stripe guide

## Competitor Features Integration (Supercreator, ChatPersona, FlirtFlow, CreatorHero, OnlyMonster)

### Fan CRM & Mass Messaging (Supercreator + CreatorHero)
- [ ] Fan CRM tabulka (fan segments, tags, LTV, last activity)
- [ ] Mass messaging systém (broadcast zprávy všem fanouškům)
- [ ] Fan segmentace (VIP, inactive, new, high-spender)
- [ ] CRM dashboard stránka pro tvůrce

### AI Chat Automation & Personas (ChatPersona + FlirtFlow)
- [ ] AI persona konfigurace (jméno, osobnost, styl komunikace)
- [ ] Auto-reply na zprávy fanoušků (AI generované odpovědi)
- [ ] Smart reply suggestions v chat UI
- [ ] Multilingual chat support

### Inactive Fan Re-engagement (FlirtFlow + CreatorHero)
- [ ] Detekce neaktivních fanoušků (30+ dní bez aktivity)
- [ ] Automatická re-engagement zpráva (winback flow)
- [ ] Expiring subscription reminder notifikace
- [ ] Win-back analytics (kolik fanoušků se vrátilo)

### Team Management (OnlyMonster)
- [ ] Týmové role (Owner, Manager, Chatter, Analyst)
- [ ] Přiřazení chatters k tvůrcům
- [ ] Team performance analytics
- [ ] Role-based access control pro creator dashboard

### Revenue & Traffic Analytics (Supercreator + OnlyMonster)
- [ ] Revenue tracking dashboard (MRR, churn, LTV)
- [ ] Traffic source analytics (odkud přicházejí fanoušci)
- [ ] Pricing optimization suggestions (AI doporučení cen)
- [ ] Conversion funnel analytics

## Seedance 2.0 AI Video Prompt Studio

- [x] DB: promptTemplates tabulka (id, title, category, engine, prompt, tags, isPublic)
- [x] DB: userVideoProjects tabulka (id, userId, title, prompt, status, videoUrl)
- [x] Backend: CRUD endpointy pro prompt templates
- [x] Backend: endpoint pro generování videa přes MiniMax/Seedance API (AI prompt enhancement)
- [x] Frontend: AI Video Studio tab v Creator Studio
- [x] Frontend: Prompt Templates knihovna s kategoriemi
- [x] Frontend: Time-Freeze preset (Seedance 2.0 prompt z PDF)
- [x] Frontend: Prompt editor s live preview a parametry
- [x] Frontend: Video projects gallery s historií generování
- [x] Seed: 10+ prompt templates (cinematic, transformation, time-freeze, etc.)
- [x] Testy pro Prompt Studio (22 testů, celkem 227)

## Premium Design & Sales Maximization (Video Best Practices)

### Landing Page Hero
- [x] Hero: nahradit slider za looping video background (nebo high-res dark cinematic image)
- [x] Hero: větší headline s premium Sans-Serif fontem (Inter/Playfair Display)
- [x] Hero: silný USP text ("Exkluzivní TG/TF obsah. Ověřená kvalita. Bez kompromisů.")
- [x] Hero: jeden dominantní CTA button (velký, high-contrast, action-oriented)
- [x] Hero: ambient glow efekt za hlavním textem pro hloubku

### Trust Bar (hned pod hero)
- [x] Trust Bar: horizontální pruh s 5 social proof prvky (hodnocení, počet členů, videí, bezpečné platby, roky)
- [x] Trust Bar: ikony + čísla + krátký popis

### Pricing Psychology
- [x] Pricing: přidat "NEJPOPULÁRNĚJŠÍ" badge na střední tier (anchor pricing)
- [x] Pricing: přidat přeškrtnutou původní cenu + "Ušetříš 50%" na každém plánu
- [x] Pricing: přidat urgency element ("Omezená nabídka - pouze do konce měsíce")
- [x] Pricing: přidat risk reversal ("7 dní zdarma, zrušení kdykoliv")
- [x] Pricing: přidat "Co dostaneš" checklist pod každý plán

### Social Proof & Testimonials
- [x] Přidat sekci s recenzemi/testimonials (hvězdičky + text + avatar)
- [x] Real-time social proof widget ("Jana z Prahy právě se přihlásila k Premium")
- [x] Počítadlo aktivních uživatelů v hero sekci

### Typography & Color Upgrade
- [x] Přidat Playfair Display pro display headings (luxusní serif)
- [x] Zvětšit line-height a letter-spacing pro premium feel
- [x] Přidat gold/bronze accent barvu (#C9A84C) pro VIP prvky
- [x] Více negative space (padding) kolem sekcí

### Product Cards (Tvůrci/Videa)
- [x] Unifikovat aspect ratio všech karet (3:4)
- [x] Přidat hover efekt s glow a scale transform
- [x] Přidat "VERIFIED" badge na ověřené tvůrce
- [x] Přidat cenu/tier badge na každou kartu

### Conversion Elements
- [x] Sticky CTA bar při scrollování dolů (mobilní)
- [x] Exit-intent popup s personalizací dle CTA varianty
- [x] Floating social proof notification widget
