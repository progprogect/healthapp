import Link from "next/link"
import Providers from "@/components/Providers"
import AppShell from "@/components/AppShell"

/**
 * Главная страница (лендинг) — без сторонних зависимостей.
 * Используются существующие утилиты и цветовые токены из проекта.
 * Секции: Hero → Как это работает → Категории → Преимущества → Финальный CTA.
 */

const CATEGORIES = [
  { slug: "psychologist", name: "Психолог", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 14c3.314 0 6-2.239 6-5s-2.686-5-6-5-6 2.239-6 5c0 2.014 1.157 3.771 2.87 4.69L8 17l4-2 4 2-1-3.31A5.97 5.97 0 0 0 12 14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
  )},
  { slug: "nutritionist", name: "Нутрициолог", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M7 12c0-3.866 3.134-7 7-7h3v3c0 3.866-3.134 7-7 7H7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 12c0 3.314 2.686 6 6 6h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
  )},
  { slug: "personal-trainer", name: "Тренер", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M9 12h6M4 12h1m14 0h1M7 8v8m10-8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
  )},
  { slug: "health-coach", name: "Коуч по здоровью", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M8 12a4 4 0 118 0v2a4 4 0 11-8 0v-2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 3v3m0 12v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
  )},
  { slug: "physiotherapist", name: "Физиотерапевт", icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 6v12m-6-6h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
  )},
];

export default function HomePage() {
  return (
    <Providers>
      <AppShell>
        {/* Hero */}
        <section className="section sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-indigo-900 tracking-tight">
                Найдите своего специалиста по здоровью
              </h1>
              <p className="mt-4 text-lg text-indigo-700">
                Психологи, нутрициологи, тренеры и другие эксперты. Каталог, заявки и встроенный чат — всё в одном месте.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  data-testid="cta-catalog"
                  href="/specialists"
                  className="btn btn-secondary text-base"
                >
                  Посмотреть каталог
                </Link>
                <Link
                  data-testid="cta-signup"
                  href="/auth/register"
                  className="btn btn-primary text-base"
                >
                  Зарегистрироваться
                </Link>
              </div>
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Почему HealthApp</h3>
                <p className="text-sm text-blue-800">
                  Проверенные специалисты, удобный поиск и честная коммуникация — без лишних приложений.
                </p>
              </div>
            </div>

            {/* Иллюстрация/превью — нейтральный прямоугольник для MVP */}
            <div className="card p-6 rounded-xl">
              <div className="aspect-[16/10] w-full bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Иллюстрация сервиса</span>
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-100 text-green-700">✓</span>
                  Каталог с фильтрами
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-100 text-green-700">✓</span>
                  Заявки и отклики
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-100 text-green-700">✓</span>
                  Встроенный чат
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-green-100 text-green-700">✓</span>
                  Проверенные специалисты
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Разделитель */}
        <div className="border-t border-gray-200"></div>

        {/* Как это работает */}
        <section className="section-bordered">
          <div className="section">
            <h2 className="text-2xl font-bold text-indigo-900">Как это работает</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-muted p-6">
                <div className="w-10 h-10 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">1</div>
                <h3 className="mt-4 font-semibold text-indigo-900">Выберите или опишите задачу</h3>
                <p className="mt-2 text-sm text-indigo-700">Найдите специалиста в каталоге или создайте заявку, чтобы получить отклики.</p>
              </div>
              <div className="card-muted p-6">
                <div className="w-10 h-10 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">2</div>
                <h3 className="mt-4 font-semibold text-indigo-900">Сравните отклики</h3>
                <p className="mt-2 text-sm text-indigo-700">Изучайте профили, опыт и цены. Выберите подходящего.</p>
              </div>
              <div className="card-muted p-6">
                <div className="w-10 h-10 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">3</div>
                <h3 className="mt-4 font-semibold text-indigo-900">Общайтесь в чате</h3>
                <p className="mt-2 text-sm text-indigo-700">Договоритесь о встрече и деталях прямо в приложении.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Разделитель */}
        <div className="border-t border-gray-200"></div>

        {/* Категории */}
        <section className="section-alt">
          <div className="section">
            <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-indigo-900">Категории специалистов</h2>
            <Link href="/specialists" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              Все специалисты →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/specialists?category=${cat.slug}`}
                className="group card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
              >
                <div className="text-indigo-600">{cat.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-indigo-700">{cat.name}</p>
                  <p className="text-xs text-gray-500">Смотреть специалистов</p>
                </div>
              </Link>
            ))}
          </div>
          </div>
        </section>

        {/* Преимущества */}
        <section className="section-bordered">
          <div className="section">
            <h2 className="text-2xl font-bold text-gray-900">Почему нас выбирают</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Проверенные специалисты", text: "Верификация и профили с ключевой информацией." },
                { title: "Удобный поиск", text: "Фильтры по опыту, цене, формату и городу." },
                { title: "Честная коммуникация", text: "Чат в приложении, никаких лишних мессенджеров." },
                { title: "Готово к масштабированию", text: "Проектная архитектура и индексы под нагрузку." },
              ].map((b, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900">{b.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Финальный CTA */}
        <section className="section">
          <div className="bg-indigo-600 rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Готовы начать?</h2>
              <p className="mt-1 text-indigo-100">Найдите специалиста в каталоге или опишите задачу — это бесплатно.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/specialists"
                className="btn btn-secondary"
              >
                Каталог специалистов
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-primary"
              >
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </section>
      </AppShell>
    </Providers>
  )
}