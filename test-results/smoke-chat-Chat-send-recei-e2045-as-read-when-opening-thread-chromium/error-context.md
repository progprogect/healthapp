# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Вход в аккаунт" [level=2] [ref=e6]
      - paragraph [ref=e7]:
        - text: Или
        - link "создайте новый аккаунт" [ref=e8] [cursor=pointer]:
          - /url: /auth/register
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Email
          - textbox "Email" [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e15]: Пароль
          - textbox "Пароль" [ref=e16]
      - button "Войти" [ref=e18]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]:
    - img [ref=e25] [cursor=pointer]
  - alert [ref=e28]
```