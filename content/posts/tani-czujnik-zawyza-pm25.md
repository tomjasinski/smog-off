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

Dla porównania: wedle skali używanej w SmogOFF granica „dobrej” jakości dla PM2.5 to 12 µg/m³ (zob. tabelę w repozytorium aplikacji), więc błąd rzędu 8 µg/m³ potrafi przesunąć punkt o całą kategorię kolorów. Ten wniosek to nasza interpretacja liczb z badania, a nie wynik z artykułu.

## Dlaczego to ważne?

Równanie powstało dla konkretnego typu czujnika i konkretnych warunków w USA, więc nie wolno go mechanicznie stosować do każdej sieci pomiarowej. Z badania wynika jednak ogólna lekcja: **tani czujnik nie jest mierzącym „na oko” urządzeniem, tylko wymaga kalibracji względem stacji referencyjnych, a wilgotność powietrza ma znaczenie dla odczytu**. [1]

## A SmogOFF?

SmogOFF pokazuje dane pobierane z publicznego API ESA i nie stosuje własnej korekty. Nie sprawdzaliśmy, jakiego typu czujniki tworzą tę sieć ani czy dostawca danych przeprowadza kalibrację, więc traktuj kolory na mapie jako orientacyjne – szczególnie przy wartościach bliskich progom między kategoriami.

## Źródła

[1] Barkjohn K. K., Gantt B., Clements A. L., *Development and application of a United States-wide correction for PM2.5 data collected with the PurpleAir sensor*, Atmospheric Measurement Techniques 14, 4617 (2021) – [amt.copernicus.org/articles/14/4617/2021](https://amt.copernicus.org/articles/14/4617/2021/) (dostęp: 27 października 2026).
