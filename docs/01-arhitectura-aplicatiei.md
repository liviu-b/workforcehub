# Arhitectura aplicației WorkforceHub

## 1. Scop

WorkforceHub este o aplicație web pentru gestionarea activității zilnice pe șantier:
- creare rapoarte de lucru pe lucrare;
- alocare echipă și ore;
- evidență materiale utilizate;
- urmărire progres;
- aprobare/finalizare raport și notificare.

## 2. Stack tehnologic

- **Frontend:** React 18 + Vite
- **UI/Styling:** Tailwind CSS + componente custom
- **Backend as a Service:** Supabase
  - autentificare anonimă;
  - stocare date în tabele;
  - funcție serverless pentru email
- **Notificări email:** Supabase Edge Function + Resend

## 3. Arhitectură logică (nivel înalt)

### 3.1 Frontend (client)

Aplicația rulează ca SPA (Single Page Application), cu schimbare internă de view (fără router dedicat).

- `dashboard` – activitatea zilei + creare rapidă raport;
- `manage` – administrare resurse (echipă, lucrări, materiale);
- `shifts` – istoric rapoarte;
- `shift-detail` – detalii complete raport + aprobare.

Componentele principale:
- `App.jsx` – orchestrare stare globală, încărcare date, navigare internă;
- `pages/*` – ecranele principale;
- `components/UI.jsx` – componente reutilizabile (Button, Card, Toast, ConfirmModal etc.);
- `components/MobileNav.jsx` – navigare mobilă fixă.

### 3.2 Date & persistență

Datele sunt păstrate în Supabase și filtrate după `app_id`.

Tabele utilizate:
- `shifts` – rapoarte de lucru;
- `employees` – angajați;
- `jobs` – lucrări/proiecte active;
- `materials` – catalog materiale;
- `user_profiles` – profil utilizator (nume afișat).

### 3.3 Integrare externă

La aprobarea unui raport:
1. raportul se marchează `approved` în tabela `shifts`;
2. se invocă funcția `send-shift-notification`;
3. funcția trimite email prin Resend.

## 4. Model de date operațional (simplificat)

### 4.1 Entitatea `shift`

Câmpuri funcționale observate în implementare:
- `id`, `app_id`
- `jobId`, `jobTitle`, `date`
- `status` (`open` / `approved`)
- `progress` (0-100)
- `assignedEmployeeIds` (listă ID)
- `employeeHours` (map ID -> ore)
- `materialUsage` (listă perechi material-cantitate)
- `notes`
- `createdAt`, `createdBy`
- `approvedAt`, `approvedBy`, `approvedByName`

### 4.2 Relații funcționale

- Un `shift` aparține unei `job`.
- Un `shift` poate avea mai mulți `employees` alocați.
- Un `shift` poate include mai multe poziții de `materials`.

## 5. Flux de date principal

1. La pornire, utilizatorul este autentificat anonim în Supabase.
2. Se încarcă în paralel datele de bază (`shifts`, `employees`, `jobs`, `materials`, `user_profiles`).
3. Utilizatorul operează pe datele locale; update-urile sunt persistate în Supabase.
4. La erori de sincronizare, UI afișează mesaj de eroare și poate reîncărca datele.

## 6. Pattern-uri UX & stare

- **Optimistic UI** în ecranul de detaliu raport (actualizare locală rapidă, apoi persistare).
- **Confirmări destructive** pentru ștergeri (modal de confirmare).
- **Feedback imediat** (toast success/error).
- **Lock după aprobare**: după finalizare, câmpurile raportului devin needitabile.

## 7. Considerații operaționale

- Aplicația depinde de setarea variabilelor de mediu Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Pentru notificări email este necesar `RESEND_API_KEY` pe funcția edge.
- În cod, adresa destinatarului pentru notificare este placeholder și trebuie configurată real pentru producție.

## 8. Limite actuale (din implementarea curentă)

- Nu există roluri complexe/permisiuni fine (autentificare anonimă).
- Navigarea internă este bazată pe state, fără rutare URL dedicată.
- Lipsesc mecanisme de audit extins / versionare pentru rapoarte.

## 9. Direcții naturale de evoluție

- introducere conturi cu roluri (manager, șef echipă, operator);
- rutare URL și deep-link către raport;
- dashboard KPI extins (productivitate, costuri materiale, timp mediu aprobare);
- configurare dinamică destinatari notificări per lucrare.
