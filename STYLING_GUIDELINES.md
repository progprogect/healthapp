# 🎨 Руководство по стилизации форм

## 📋 Правила использования UI компонентов

### ✅ Правильно - используйте компоненты
```tsx
import { Input, Select, Textarea, Radio, Checkbox } from '@/components/ui';

// Input с лейблом и валидацией
<Input
  label="Email"
  name="email"
  type="email"
  required
  placeholder="Введите email"
  value={email}
  onChange={handleChange}
  error={hasError}
  errorText="Email обязателен"
/>

// Select с опциями
<Select
  label="Категория"
  options={CATEGORIES}
  placeholder="Выберите категорию"
  value={category}
  onChange={handleChange}
/>

// Textarea для длинного текста
<Textarea
  label="Описание"
  placeholder="Введите описание..."
  value={description}
  onChange={handleChange}
  rows={4}
/>

// Radio кнопки
<Radio
  name="format"
  value="online"
  checked={format === 'online'}
  onChange={handleChange}
  label="Только онлайн"
/>

// Checkbox
<Checkbox
  name="verified"
  checked={verified}
  onChange={handleChange}
  label="Только верифицированные"
/>
```

### ❌ Неправильно - не используйте нативные элементы с минимальными классами
```tsx
// НЕ ДЕЛАЙТЕ ТАК!
<input className="mt-1" />  // Только margin
<input className="rounded-t-md" />  // Только border-radius
<textarea className="flex-1" />  // Только flex
<input type="radio" className="h-4 w-4" />  // Минимальные стили
<input type="checkbox" className="border-gray-300" />  // Неполные стили
```

## 🎯 CSS классы для форм

### Универсальные классы
- `.form-input` - базовые стили для всех input элементов
- `.form-textarea` - базовые стили для textarea
- `.form-radio` - стили для радиобаттонов
- `.form-checkbox` - стили для чекбоксов
- `.form-input-error` - стили для ошибок
- `.specialists-select` - стили для селектов в фильтрах

### Использование классов
```tsx
// Если нужно добавить дополнительные стили
<input className="form-input w-full" />
<textarea className="form-textarea h-32" />
<select className="specialists-select" />
```

## 🔧 Компоненты

### Input
- **Props**: `label`, `error`, `helperText`, `errorText`, `className`
- **Автоматически**: генерация ID, связка label-input
- **Стили**: `.form-input` + `.form-input-error` при ошибке

### Select  
- **Props**: `options`, `placeholder`, `error`, `className`
- **Опции**: массив `{value, label}` объектов
- **Стили**: `.specialists-select` + `.form-input-error` при ошибке

### Textarea
- **Props**: `label`, `error`, `helperText`, `errorText`, `className`
- **Автоматически**: `resize: vertical`, минимальная высота
- **Стили**: `.form-textarea` + `.form-input-error` при ошибке

## 🚨 Важные правила

1. **Всегда используйте компоненты** вместо нативных элементов
2. **Не смешивайте** Tailwind классы с CSS классами форм
3. **Тестируйте** на разных устройствах
4. **Проверяйте** accessibility (labels, IDs, focus states)
5. **Используйте** error states для валидации

## 🔍 Проверка стилей

При добавлении новых форм проверьте:
- [ ] Используются ли UI компоненты?
- [ ] Есть ли лейблы для всех полей?
- [ ] Работают ли focus states?
- [ ] Корректно ли отображаются ошибки?
- [ ] Адаптивны ли формы на мобильных?

## 📝 Примеры

### Простая форма
```tsx
<form className="space-y-4">
  <Input
    label="Имя"
    name="name"
    required
    value={name}
    onChange={handleChange}
  />
  <Select
    label="Категория"
    options={categories}
    value={category}
    onChange={handleChange}
  />
  <button type="submit" className="btn btn-primary">
    Сохранить
  </button>
</form>
```

### Форма с валидацией
```tsx
<form className="space-y-4">
  <Input
    label="Email"
    name="email"
    type="email"
    required
    value={email}
    onChange={handleChange}
    error={errors.email}
    errorText="Введите корректный email"
  />
  <Textarea
    label="Сообщение"
    name="message"
    required
    value={message}
    onChange={handleChange}
    error={errors.message}
    errorText="Сообщение обязательно"
    rows={4}
  />
</form>
```
