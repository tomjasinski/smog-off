---
title: Dlaczego tani czujnik pyłu potrafi zawyżyć wynik o 40%
excerpt: Badacze porównali tysiące pomiarów popularnych czujników PM2.5 z urzędowymi stacjami. Okazało się, że surowe odczyty zawyżają wynik, a poprawka uwzględnia wilgotność powietrza.
image: ''
---

# Dlaczego tani czujnik pyłu potrafi zawyżyć wynik o 40%

Małe, niedrogie czujniki pyłu zawieszonego trafiają dziś do domów, szkół i na dachy. Dzięki nim mapy jakości powietrza są gęste jak nigdy wcześniej. Ale czy ich odczyty można brać dosłownie?

## Badanie, które to sprawdziło

Zespół badaczy związany z amerykańską Agencją Ochrony Środowiska (EPA) porównał odczyty czujników PurpleAir z pomiarami referencyjnymi. Do analizy użyto prawie **12 000 średnich dobowych pomiarów PM2.5** z czujników ustawionych obok stacji referencyjnych w **16 stanach USA**. Początkowo uwzględniono 53 czujniki w 39 miejscach, a po odrzuceniu części danych do modelu trafiło 50 czujników. [1]

## Co wyszło?

- Surowe dane z czujników PurpleAir **zawyżały stężenie PM2.5 o około 40%** w większości części Stanów Zjednoczonych. [1]
- Prosta korekta liniowa poprawiała wynik, a dodanie do niej **wilgotności względnej (RH)** jako osobnej zmiennej jeszcze go ulepszało. [1]
- Ostateczne równanie z artykułu to: **PM2.5 = 0,524 × odczyt czujnika − 0,0862 × RH + 5,75**, gdzie RH podaje się w procentach. [1]
- Po zastosowaniu korekty średni błąd (RMSE) spadł **z 8 do 3 µg/m³**. [1]

## Wniosek

Badanie pokazuje, że niedrogie czujniki są bardzo użyteczne, gdy porównamy je ze stacjami referencyjnymi i uwzględnimy wilgotność powietrza. Dzięki takiej kalibracji ich odczyty zbliżają się do pomiarów urzędowych, a błąd spada z 8 do 3 µg/m³. [1] To jeden z powodów, dla których gęste sieci czujników mogą skutecznie uzupełniać sieć stacji referencyjnych i pokazywać zanieczyszczenie tam, gdzie wcześniej nie było go widać.

## Źródła

[1] Barkjohn K. K., Gantt B., Clements A. L., *Development and application of a United States-wide correction for PM2.5 data collected with the PurpleAir sensor*, Atmospheric Measurement Techniques 14, 4617 (2021) – [amt.copernicus.org/articles/14/4617/2021](https://amt.copernicus.org/articles/14/4617/2021/) (dostęp: 27 października 2026).
