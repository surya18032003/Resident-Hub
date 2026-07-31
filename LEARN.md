# Understanding this codebase

A guided tour of ResHub for someone who is new to Angular. Read it top to
bottom once; after that use it as a map.

---

## 1. The one-minute version

An Angular app is a tree of **components**. A component is three files with the
same name:

```
login.ts      the logic  (a TypeScript class)
login.html    the markup (what you see)
login.css     the styles (only apply to this component)
```

The `.ts` file glues the three together:

```ts
@Component({
  selector: 'app-login', // the tag: <app-login />
  imports: [ReactiveFormsModule], // what this template is allowed to use
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  /* fields and methods the template can read */
}
```

Anything **public** on the class can be used in that component's HTML, and
nowhere else. That is the whole relationship.

---

## 2. How a page appears on screen

Follow one click all the way through — it is the same journey every time.

```
index.html          has <app-root></app-root>
   ↓
main.ts             starts Angular with the App component and app.config.ts
   ↓
app.config.ts       switches on the router, HttpClient and the interceptors
   ↓
app.html            <router-outlet /> = "draw the current page here"
   ↓
app.routes.ts       address /admin/residents → the ResidentList component
   ↓
auth.guards.ts      may I open it? (signed in? right role?)
   ↓
resident-list.ts    asks ResidentService for the data
   ↓
resident.service.ts asks ApiService
   ↓
api.service.ts      HttpClient sends the real request
   ↓
interceptors        add the token, count the request, tidy up errors
   ↓
the server
```

The answer travels back the same way, the component stores it, and Angular
repaints the template.

---

## 3. Folder map

```
src/app/
├── core/        the brain. Services, guards, interceptors. No visuals.
├── shared/      small building blocks reused everywhere (button-sized things).
├── layout/      the frame: sidebar, topbar, and the shell holding them.
└── features/    one folder per screen.
```

The rule of thumb: **if it draws something, it is not in `core/`. If it is used
by exactly one screen, it is not in `shared/`.**

### core/

| File                                | What it does                                        |
| ----------------------------------- | --------------------------------------------------- |
| `services/api.service.ts`           | The only file that knows the server address.        |
| `services/auth.service.ts`          | Who is signed in; login and logout.                 |
| `services/resident.service.ts`      | Create and list residents.                          |
| `services/announcement.service.ts`  | Create, list, pin/unpin announcements.              |
| `services/document.service.ts`      | Upload and list documents.                          |
| `services/notification.service.ts`  | Sorts documents into expired / today / soon.        |
| `services/toast.service.ts`         | The pop-up messages.                                |
| `services/loading.service.ts`       | Counts running requests for the top blue bar.       |
| `services/local-records.service.ts` | Works around a bug in the API — see §8.             |
| `guards/auth.guards.ts`             | Decides who may open which route.                   |
| `interceptors/*.ts`                 | Run on every request.                               |
| `validators/app.validators.ts`      | Extra form rules + the error sentences.             |
| `utils/*.ts`                        | Small helper functions (dates, arrays).             |
| `models/*.ts`                       | TypeScript shapes: what a Resident looks like, etc. |
| `config/navigation.ts`              | The sidebar menu, per role.                         |

---

## 4. Angular ideas used here, in plain words

### Component

A piece of screen with its own logic. `<app-search-box />` is one.

### Service

A class holding logic that is not about drawing. Marked with:

```ts
@Injectable({ providedIn: 'root' })
```

`root` means Angular creates exactly **one** of it and hands the same instance
to everyone who asks. That is why `AuthService` knows you are signed in no
matter which page asks.

### inject()

How a component gets a service:

```ts
private auth = inject(AuthService);
```

This is the modern spelling of `constructor(private auth: AuthService) {}`.
Both work; this app uses `inject()` everywhere for consistency.

### How the screen updates

There is nothing special to learn here — that is the point. State is a plain
property, and you change it with `=`:

```ts
loading = true; // a normal class field
this.loading = false; // a normal assignment
```

Angular repaints by itself. **Zone.js** (switched on in `app.config.ts`) watches
every click, timer and HTTP reply, and after each one Angular re-reads the
templates and updates whatever changed. So this just works:

```ts
this.residentService.list().subscribe({
  next: (residents) => {
    this.residents = residents; // the table redraws on its own
    this.loading = false; // so does the spinner
  },
});
```

Methods work in templates too. `filtered()` in `resident-list.ts` is an ordinary
method, and Angular calls it again on each repaint. Keep such methods cheap —
filtering an array is fine, calling the server from one is not.

### @Input() and @Output()

How a parent and a child component talk.

```ts
// child
@Input() placeholder = 'Search…';           // parent sends data down
@Output() valueChange = new EventEmitter(); // child sends events up
```

```html
<!-- parent -->
<app-search-box placeholder="Search names…" (valueChange)="onSearch($event)" />
```

`$event` is whatever the child passed to `.emit(...)`.

### Template syntax cheat sheet

| Written in HTML                          | Meaning                                           |
| ---------------------------------------- | ------------------------------------------------- |
| `{{ value }}`                            | print a value                                     |
| `[title]="value"`                        | set a property from an expression                 |
| `title="Residents"`                      | set a property to fixed text                      |
| `(click)="save()"`                       | run a method on an event                          |
| `[class.is-open]="open"`                 | add the class when the expression is true         |
| `@if (x) { } @else { }`                  | show one branch or the other                      |
| `@for (item of list; track item.id) { }` | repeat. `track` tells Angular which item is which |
| `@if (thing(); as t) { }`                | run it once and call the result `t`               |
| `\| apiDate`                             | send the value through a pipe before printing     |
| `#field`                                 | name an element so you can pass it to a method    |

### Observable and subscribe

HTTP replies arrive later, so `HttpClient` hands back an **Observable**: a
promise of "a value, some day". Nothing happens until somebody subscribes:

```ts
this.residentService.list().subscribe({
  next: (residents) => {
    /* it worked */
  },
  error: (error) => {
    /* it failed */
  },
});
```

`.pipe(map(...))` transforms the value on the way through, which is what the
services do to unwrap the API's envelope.

### Route

A rule in `app.routes.ts`: this address shows that component.

```ts
{
  path: 'residents',
  loadComponent: () => import('...').then((m) => m.ResidentList),
}
```

`loadComponent` with `import()` is **lazy loading**: the code for that screen is
only downloaded when someone actually goes there.

### Guard

A function that returns `true` (open the page) or a redirect. Attached with
`canActivate: [authGuard]`.

### Interceptor

A function every request passes through. This app has three, and the order in
`app.config.ts` is the order they run:

1. `loadingInterceptor` — counts the request so the blue bar shows.
2. `authInterceptor` — adds `Authorization: Bearer <token>`.
3. `errorInterceptor` — turns any failure into one readable sentence.

### Pipe

A converter used inside a template with `|`:

```html
{{ doc.expiry_date | apiDate }}
<!-- 07 Jul 2026 -->
```

`apiDate` lives in `shared/pipes/api-date.pipe.ts`.

### Reactive Form

The form is built in TypeScript and the HTML connects to it:

```ts
form = this.formBuilder.nonNullable.group({
  email: ['', [Validators.required, emailAddress()]],
});
```

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <input formControlName="email" />
</form>
```

Useful bits: `form.invalid`, `form.getRawValue()`, `form.markAllAsTouched()`
(reveals every error message at once), `form.reset()`.

---

## 5. Reading one screen end to end

Open these four files side by side — it is the clearest example in the app:

1. **`features/admin/residents/resident-list/resident-list.ts`**
   Holds `residents`, `loading`, `search`, `page`. `load()` fetches; `filtered()`
   applies the search; `paged()` cuts out the current page.
2. **`resident-list.html`**
   Four states in order: loading skeleton → error → empty → the table.
3. **`core/services/resident.service.ts`**
   `list()` calls the API and tidies the answer.
4. **`core/services/api.service.ts`**
   Builds the URL and sends it.

Every list screen in this app follows that exact shape.

---

## 6. How to make a change

**Change wording or layout** → the screen's `.html`.

**Change colours or spacing** → the screen's `.css`, or `src/styles.css` for
things shared by every page (buttons, cards, tables, the colour palette at the
very top).

**Add a menu item** → `core/config/navigation.ts`, then add a matching route in
`app.routes.ts`.

**Add a whole page**

1. Make a folder under `features/` with `thing.ts`, `thing.html`, `thing.css`.
2. Copy the smallest existing screen (`features/errors/forbidden/`) as a start.
3. Register it in `app.routes.ts` with `loadComponent`.
4. Add it to `core/config/navigation.ts` if it needs a menu entry.

**Call a new endpoint** → add a method to the matching service in
`core/services/`. Do not call `HttpClient` from a component.

---

## 7. Running it

```bash
npm start        # http://localhost:4200, reloads as you save
npm run build    # production build into dist/
```

Sign in with the demo buttons on the login page. `admin@gmail.com / Admin@123`
is the Super Admin.

---

## 8. Two odd things, explained

**Why do created residents and documents come from localStorage?**

The API saves them correctly — it replies "User created successfully" — but its
`list_user` and `list_document` endpoints always return the same single record,
so a new one would never appear. `local-records.service.ts` keeps a copy in the
browser and the services merge it into the list, marked with a small **New**
badge. If the API is ever fixed, the duplicate check drops the local copy
automatically. `list_announcement` does not have this problem.

**Why are some dates read in UTC?**

Day-only fields (`event_date`, `expiry_date`) are stored at midnight UTC. Read
with a normal `getDate()`, a browser in a western time zone would show the day
before. `date.utils.ts` reads those with `getUTCDate()`, while `created_time` —
a real moment in time — is shown in your own time zone.

---

## 9. Where to look things up

- Angular docs: <https://angular.dev> — the tutorials there match the style
  used in this project (standalone components, `@if`/`@for`). The docs also
  cover _signals_, a newer way of holding state — this project deliberately
  does not use them, so ordinary properties are all you need to read the code.
- The design of every screen is described in `README.md`.
