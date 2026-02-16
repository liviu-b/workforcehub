# Flow-ul aplicației WorkforceHub

## 1. Flow general (end-to-end)

1. Utilizatorul deschide aplicația.
2. Se face autentificare anonimă și încărcare date inițiale.
3. Utilizatorul navighează între:
   - Azi (`dashboard`)
   - Rapoarte (`shifts`)
   - Admin (`manage`)
4. Se creează/actualizează activități de lucru.
5. Se finalizează raportul prin aprobare.
6. Sistemul trimite notificare email.

## 2. Flow detaliat pe ecrane

### 2.1 Dashboard (Azi)

**Scop:** vedere rapidă asupra zilei curente și pornire raport nou.

Pași:
1. Se afișează activitatea zilei filtrată după data curentă.
2. Utilizatorul poate edita numele de profil (salvat în `user_profiles`).
3. Utilizatorul poate porni un raport nou selectând o lucrare.
4. Raportul nou este creat cu status `open` și deschis direct în detaliu.

### 2.2 Manage (Admin)

**Scop:** administrarea datelor master.

Pași:
1. Adăugare/actualizare/ștergere angajați.
2. Adăugare/actualizare/ștergere lucrări.
3. Adăugare/ștergere materiale + unitate de măsură.
4. Datele sunt persistate imediat în Supabase.

### 2.3 Reports (Rapoarte)

**Scop:** consultarea istoricului complet de rapoarte.

Pași:
1. Lista rapoartelor este sortată descrescător după dată.
2. Fiecare element indică status, dată, progres.
3. Click pe raport -> deschidere ecran detaliu.

### 2.4 Shift Detail (Detaliu raport)

**Scop:** completarea efectivă a raportului.

Pași principali:
1. Ajustare progres (%).
2. Selectare echipă + completare ore lucrate per persoană.
3. Adăugare materiale consumate (material + cantitate).
4. Completare note (autosave cu debounce).
5. Export PDF la cerere.
6. Finalizare prin „Finalizează Raportul”.

După aprobare:
- raportul devine read-only;
- se salvează metadate de aprobare (`approvedAt`, `approvedBy`, `approvedByName`);
- se trimite notificare email.

## 3. Flow de date și sincronizare

- La încărcare: fetch paralel al seturilor principale de date.
- La editare în detaliu raport: update local imediat (optimistic) + update în DB.
- La eroare de scriere: mesaj de eroare + refresh date din backend.

## 4. Flow de eroare (rezumat)

- Eroare autentificare -> mesaj „Eroare la autentificare”.
- Eroare încărcare date -> mesaj „Eroare la încărcarea datelor”.
- Eroare operație CRUD -> toast de eroare contextual.
- Eroare notificare email -> raportul rămâne aprobat, log de eroare pentru notificare.

## 5. Flow operațional recomandat în utilizare

1. Configurare inițială în Admin (echipă, lucrări, materiale).
2. Operare zilnică în Dashboard (creare rapoarte).
3. Completare continuă în Detaliu Raport.
4. Validare și aprobare la final de zi / final de lucrare.
5. Consultare istoric în Rapoarte.
