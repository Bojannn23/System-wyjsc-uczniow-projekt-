SRS — System Rejestru Wyjść Uczniów

Autorzy: Nikodem Waśniowski, Oskar Bojanowski

Wersja: 1.0

Typ dokumentu: Software Requirements Specification (SRS)

Zakres: MVP


1. Cel systemu
Celem systemu jest umożliwienie nauczycielowi szybkiego rejestrowania wyjść uczniów z sali podczas trwania lekcji, np. w celu skorzystania z toalety.
System ma zastąpić tradycyjne zapisywanie takich informacji na kartce lub w zeszycie.
Główne zadania systemu:

    • rejestrowanie wyjścia ucznia,
   
    • rejestrowanie powrotu ucznia,
   
    • przechowywanie informacji o wyjściach,
   
    • umożliwienie nauczycielowi sprawdzenia, kto aktualnie znajduje się poza salą.
   
    • Wgląd go historii i pobranie raportu.

3. Zakres 
W pierwszej wersji system powinien umożliwiać:
    1. Logowanie nauczyciela.
    2. Wybór klasy.
    3. Wyświetlenie listy uczniów.
    4. Wybranie ucznia.
    5. Zarejestrowanie jego wyjścia.
    6. Automatyczne zapisanie godziny wyjścia.
    7. Zarejestrowanie powrotu ucznia.
    8. Automatyczne zapisanie godziny powrotu.
    9. Wyświetlenie listy uczniów aktualnie przebywających poza salą.
    10. Przeglądanie historii wyjść.
    11. Pobranie raportu wyjść uczniów.


4. Użytkownicy systemu
Występują trzy podstawowe typy użytkowników.
Nauczyciel
Nauczyciel może:

    • zalogować się do systemu,
   
    • wybrać klasę z jaką aktualnie ma lekcje,
   
    • zobaczyć listę uczniów,
   
    • zarejestrować wyjście ucznia,
   
    • zarejestrować powrót ucznia,
   
    • Jeśli jest wychowawcą klasy, może zobaczyć historię wyjść czy pobrać raport.
   
Dyrektor(Administrator)
Dyrektor może:

    • zalogować się do systemu
    
    • oglądać dane – wyjścia uczniów
    
    • pobrać raport wszystkich klas
    
    • pobrać raport szczegółowy np. 1 osoby czy klasy
    
    • edytować dane uczniów,
    
    • dodawać konta nauczycieli,
    
    • zarządzać klasami.

Pedagog może:

    • zalogować się do systemu
    
    • oglądać dane – wyjścia uczniów
    
    • pobrać raport wszystkich klas
    
    • pobrać raport szczegółowy np. 1 osoby czy klasy
    

4. Wymagania funkcjonalne
WF-01 — Logowanie
System musi umożliwiać nauczycielowi zalogowanie się przy użyciu loginu i hasła.
Dane wejściowe:

    • login,
   
    • hasło.
   

<img width="692" height="721" alt="image" src="https://github.com/user-attachments/assets/cbb5223a-1bf2-4519-ae3d-e3bb3673db07" />


Rezultat:
Po poprawnym zalogowaniu nauczyciel zostaje przekierowany do panelu głównego.

WF-02 — Lista uczniów
System musi wyświetlać listę uczniów przypisanych do danej klasy.
Przykład:

<img width="640" height="434" alt="image" src="https://github.com/user-attachments/assets/8c44a3e0-b532-441b-a4de-07a83e7a2990" />


WF-03 — Rejestracja wyjścia
Nauczyciel może nacisnąć przycisk „Wyjście” przy wybranym uczniu.
System zapisuje:

    • identyfikator ucznia,
    
    • datę,
    
    • godzinę wyjścia,
    
    • rodzaj wyjścia,
    
Przykład:

<img width="612" height="391" alt="image" src="https://github.com/user-attachments/assets/fc7b4d33-5640-4fac-81c8-2405335cd2f7" />




WF-04 — Rejestracja powrotu
Po powrocie ucznia nauczyciel wybiera opcję „Powrót”.

<img width="379" height="495" alt="image" src="https://github.com/user-attachments/assets/21bf244e-2eb8-48a8-9d3d-3534e495b1fd" />


System zapisuje godzinę powrotu.


WF-05 — Aktualny status ucznia
System musi informować, czy uczeń znajduje się:

    • w sali,
    
    • poza salą.
    
Uczeń, który ma aktywne wyjście, powinien być oznaczony jako „Poza salą”.


<img width="682" height="259" alt="image" src="https://github.com/user-attachments/assets/f912eebf-49bb-4765-b9be-b89cf0116c1c" />



WF-06 — Historia wyjść
Nauczyciel może zobaczyć historię wyjść.
Przykład:

<img width="687" height="431" alt="image" src="https://github.com/user-attachments/assets/a6d24076-020a-4289-9dce-8d3d5424c9a2" />


WF-07 — Generowanie raportu
System musi umożliwiać uprawnionemu użytkownikowi wygenerowanie raportu wyjść uczniów. Raport powinien umożliwiać filtrowanie danych według:

- ucznia,

- klasy,
  
- zakresu dat,
  
- rodzaju wyjścia.
  
Raport powinien zawierać co najmniej:

- imię i nazwisko ucznia,
  
- klasę,
  
- datę,
  
- godzinę wyjścia,
  
- godzinę powrotu,
  
- rodzaj wyjścia.
  



WF-08 — Walidacja aktywnego wyjścia
System nie może pozwolić na zarejestrowanie kolejnego wyjścia ucznia, który posiada aktywne wyjście. System powinien wyświetlić komunikat informujący o istniejącym aktywnym wyjściu. 

5. Wymagania niefunkcjonalne
WNF-01 — Wydajność
To jest dobre wymaganie, ale warto napisać dokładniej: 95% operacji rejestracji wyjścia lub powrotu powinno zakończyć się w czasie nie dłuższym niż 2 sekundy przy normalnym obciążeniu systemu. 
WNF-02 — Bezpieczeństwo
Hasła użytkowników nie mogą być przechowywane w bazie danych w postaci jawnego tekstu.
WNF-03 — Dostępność
System powinien być dostępny z poziomu popularnych przeglądarek internetowych.
WNF-04 — Prostota
Rejestracja wyjścia powinna wymagać od nauczyciela maksymalnie kilku kliknięć.

6. Przypadki użycia
UC-01 — Rejestracja wyjścia ucznia
Aktor: Nauczyciel
Warunek początkowy: Nauczyciel jest zalogowany.
Przebieg:

    1. Nauczyciel wybiera klasę.
    2. Nauczyciel rozpoczyna lekcję.
    3. Znajduje odpowiedniego ucznia.
    4. Kliknie przycisk „Wyjście”.
    5. Wybiera powód, np. „Toaleta”.
    6. System zapisuje godzinę wyjścia.
    7. Status ucznia zostaje zmieniony na „Poza salą”.
Rezultat: Wyjście ucznia zostaje zapisane w systemie.

7. Przypadek użycia — Powrót
UC-02 — Rejestracja powrotu ucznia
Aktor: Nauczyciel
Przebieg:
    1. Nauczyciel widzi ucznia oznaczonego jako „Poza salą”.
    2. Uczeń wraca do klasy.
    3. Nauczyciel klika „Powrót”.
    4. System zapisuje aktualną godzinę.
    5. Status ucznia zmienia się na „W sali”.

8. Model danych
Baza danych prezentująca się w następujący sposób:


<img width="666" height="447" alt="image" src="https://github.com/user-attachments/assets/54144fd3-f0c0-4645-b8cb-2ce46c08ad83" />




9. Interfejs użytkownika
Wybór klasy:

<img width="697" height="322" alt="image" src="https://github.com/user-attachments/assets/654e09e2-da2e-4145-9455-6a95ecdcd48f" />


Rejestracja wyjścia i lista klasy:

<img width="636" height="432" alt="image" src="https://github.com/user-attachments/assets/68106333-1386-4c93-a43b-ab33651a5466" />


Historia wyjść:

<img width="709" height="549" alt="image" src="https://github.com/user-attachments/assets/a5b2f787-8eca-4f23-b9cd-7d394c263ebb" />


10. Reguły biznesowe
System powinien przestrzegać kilku podstawowych zasad:

    • Jeden uczeń może mieć maksymalnie jedno aktywne wyjście.
    
    • Nie można zarejestrować powrotu ucznia, który nie ma aktywnego wyjścia.
    
    • Godzina wyjścia jest ustalana automatycznie przez system.
    
    • Godzina powrotu jest ustalana automatycznie przez system.
    
    • Wyjście bez powrotu pozostaje oznaczone jako aktywne.
    
    • Tylko zalogowany nauczyciel może rejestrować wyjścia.
    
    • Tylko wychowawca(jeżeli jest zalogowany jako nauczyciel) ma wgląd do historii.


12. Kryteria akceptacji 
System można uznać za spełniający wymagania, jeżeli nauczyciel(wychowawca) może:

    • zalogować się,
    
    • wybrać klasę
    
    • zobaczyć uczniów,
    
    • wybrać ucznia,
    
    • zarejestrować wyjście,
    
    • zobaczyć godzinę wyjścia,
    
    • zarejestrować powrót,
    
    • zobaczyć godzinę powrotu,
    
    • sprawdzić, kto aktualnie jest poza salą,
    
    • wyświetlić historię wyjść.
    
Najprostszy przepływ całego systemu

     Logowanie → Wybór klasy → Rejestracja wyjścia → Wgląd do historii wyjść → pobranie raportu.
