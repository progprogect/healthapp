'use client';

export default function AppFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2024 HealthApp. Все права защищены.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Политика конфиденциальности
            </a>
            <a href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Условия использования
            </a>
            <a href="/contact" className="text-sm text-gray-500 hover:text-gray-900">
              Контакты
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}