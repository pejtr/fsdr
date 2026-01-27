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
