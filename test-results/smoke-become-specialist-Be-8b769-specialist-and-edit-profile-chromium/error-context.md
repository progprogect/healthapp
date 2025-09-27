# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e6]:
        - link "HealthApp" [ref=e8] [cursor=pointer]:
          - /url: /
        - navigation [ref=e9]:
          - link "Каталог" [ref=e10] [cursor=pointer]:
            - /url: /specialists
          - link "Войти" [ref=e11] [cursor=pointer]:
            - /url: /auth/login
          - link "Регистрация" [ref=e12] [cursor=pointer]:
            - /url: /auth/register
    - main [ref=e14]:
      - generic [ref=e19]:
        - img [ref=e21]
        - heading "Ошибка" [level=3] [ref=e23]
        - paragraph [ref=e24]: Failed to fetch profile
        - button "Вернуться в кабинет" [ref=e25]
      - generic [ref=e28]:
        - generic [ref=e29]: © 2024 HealthApp. Все права защищены.
        - generic [ref=e30]:
          - link "Политика конфиденциальности" [ref=e31] [cursor=pointer]:
            - /url: /privacy
          - link "Условия использования" [ref=e32] [cursor=pointer]:
            - /url: /terms
          - link "Контакты" [ref=e33] [cursor=pointer]:
            - /url: /contact
    - region "Notifications alt+T"
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40] [cursor=pointer]
  - alert [ref=e43]
```