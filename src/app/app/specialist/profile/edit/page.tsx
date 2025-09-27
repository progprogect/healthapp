'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Providers from '@/components/Providers';
import { toast } from 'sonner';
import AvatarImage from '@/components/AvatarImage';

interface SpecialistProfile {
  id: string;
  displayName: string;
  bio: string;
  experienceYears: number;
  onlineOnly: boolean;
  city: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  currency: string;
  verified: boolean;
  avatarUrl: string | null;
  categories: {
    slug: string;
    name: string;
  }[];
}

interface Category {
  slug: string;
  name: string;
}

interface ProfileFormData {
  displayName: string;
  bio: string;
  experienceYears: number;
  onlineOnly: boolean;
  city: string;
  priceMin: string;
  priceMax: string;
  categorySlugs: string[];
}

interface ProfileFormErrors {
  displayName?: string;
  bio?: string;
  experienceYears?: string;
  city?: string;
  priceMin?: string;
  priceMax?: string;
  categories?: string;
  general?: string;
}

function EditSpecialistProfilePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    bio: '',
    experienceYears: 0,
    onlineOnly: true,
    city: '',
    priceMin: '',
    priceMax: '',
    categorySlugs: [],
  });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState<ProfileFormData | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем профиль и категории параллельно
      const [profileResponse, categoriesResponse] = await Promise.all([
        fetch('/api/me/specialist-profile'),
        fetch('/api/categories')
      ]);

      if (!profileResponse.ok) {
        if (profileResponse.status === 403) {
          router.push('/app');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories');
      }

      const profileData: SpecialistProfile = await profileResponse.json();
      const categoriesData = await categoriesResponse.json();

      setProfile(profileData);
      setCategories(categoriesData.categories);

      // Инициализируем форму данными профиля
      const initialData: ProfileFormData = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        experienceYears: profileData.experienceYears,
        onlineOnly: profileData.onlineOnly,
        city: profileData.city || '',
        priceMin: profileData.priceMinCents ? (profileData.priceMinCents / 100).toString() : '',
        priceMax: profileData.priceMaxCents ? (profileData.priceMaxCents / 100).toString() : '',
        categorySlugs: profileData.categories?.map(c => c.slug) || [],
      };

      setFormData(initialData);
      setInitialFormData(initialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Отслеживаем изменения в форме
  useEffect(() => {
    if (initialFormData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasChanges(changed);
    }
  }, [formData, initialFormData]);

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (formErrors[field as keyof ProfileFormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ProfileFormErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Введите имя';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = 'Имя должно содержать минимум 2 символа';
    } else if (formData.displayName.length > 60) {
      newErrors.displayName = 'Имя не должно превышать 60 символов';
    }

    if (formData.bio.length > 2000) {
      newErrors.bio = 'Описание не должно превышать 2000 символов';
    }

    if (formData.experienceYears < 0 || formData.experienceYears > 50) {
      newErrors.experienceYears = 'Опыт должен быть от 0 до 50 лет';
    }

    if (!formData.onlineOnly && !formData.city.trim()) {
      newErrors.city = 'Город обязателен для очных встреч';
    }

    // Валидация цен
    const priceMin = formData.priceMin ? parseFloat(formData.priceMin) : null;
    const priceMax = formData.priceMax ? parseFloat(formData.priceMax) : null;

    if (priceMin !== null && priceMin < 0) {
      newErrors.priceMin = 'Цена не может быть отрицательной';
    }
    if (priceMax !== null && priceMax < 0) {
      newErrors.priceMax = 'Цена не может быть отрицательной';
    }
    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      newErrors.priceMin = 'Минимальная цена не может быть больше максимальной';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);

      // Валидация файла
      if (!file.type.startsWith('image/')) {
        toast.error('Выберите изображение');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 2MB');
        return;
      }

      // Получаем URL для загрузки
      const uploadResponse = await fetch('/api/me/avatar-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          size: file.size
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        toast.error(errorData.error || 'Ошибка при получении URL загрузки');
        return;
      }

      const { uploadUrl, publicUrl } = await uploadResponse.json();

      // Загружаем файл
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResult.ok) {
        toast.error('Ошибка при загрузке файла');
        return;
      }

      // Сохраняем URL аватара в профиле
      const profileResponse = await fetch('/api/me/specialist-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          bio: formData.bio,
          experienceYears: formData.experienceYears,
          onlineOnly: formData.onlineOnly,
          city: formData.onlineOnly ? null : formData.city.trim() || null,
          priceMinCents: formData.priceMin ? Math.round(parseFloat(formData.priceMin) * 100) : null,
          priceMaxCents: formData.priceMax ? Math.round(parseFloat(formData.priceMax) * 100) : null,
          avatarUrl: publicUrl
        })
      });

      if (!profileResponse.ok) {
        toast.error('Ошибка при сохранении аватара');
        return;
      }

      // Обновляем состояние
      setAvatarPreview(publicUrl);
      if (profile) {
        setProfile({ ...profile, avatarUrl: publicUrl });
      }

      toast.success('Аватар успешно обновлен!');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Произошла ошибка при загрузке аватара');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setSaving(true);
    setFormErrors({});

    try {
      // Подготавливаем данные для отправки
      const priceMinCents = formData.priceMin ? Math.round(parseFloat(formData.priceMin) * 100) : null;
      const priceMaxCents = formData.priceMax ? Math.round(parseFloat(formData.priceMax) * 100) : null;

      const profileData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        experienceYears: formData.experienceYears,
        onlineOnly: formData.onlineOnly,
        city: formData.onlineOnly ? null : formData.city.trim() || null,
        priceMinCents,
        priceMaxCents
      };

      // Сохраняем профиль и категории параллельно
      const [profileResponse, categoriesResponse] = await Promise.all([
        fetch('/api/me/specialist-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        }),
        fetch('/api/me/specialist-categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: formData.categorySlugs }),
        })
      ]);

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        if (errorData.details) {
          const fieldErrors: ProfileFormErrors = {};
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.field as keyof ProfileFormErrors] = detail.message;
          });
          setFormErrors(fieldErrors);
        } else {
          setFormErrors({ general: errorData.error || 'Ошибка при сохранении профиля' });
        }
        toast.error('Ошибка при сохранении профиля');
        return;
      }

      if (!categoriesResponse.ok) {
        const errorData = await categoriesResponse.json();
        setFormErrors({ categories: errorData.error || 'Ошибка при сохранении категорий' });
        toast.error('Ошибка при сохранении категорий');
        return;
      }

      // Обновляем начальные данные для отслеживания изменений
      setInitialFormData({ ...formData });
      toast.success('Профиль успешно сохранен!');
      
    } catch (err) {
      setFormErrors({ general: 'Произошла ошибка при сохранении' });
      toast.error('Произошла ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/app')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Вернуться в кабинет
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Редактирование профиля специалиста</h1>
          
          {formErrors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{formErrors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Аватар */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Аватар
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <AvatarImage
                    src={avatarPreview || profile?.avatarUrl}
                    alt="Аватар"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="text-white text-xs">Загрузка...</div>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAvatarUpload(file);
                      }
                    }}
                    disabled={uploadingAvatar}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {uploadingAvatar ? 'Загрузка...' : 'Загрузить аватар'}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, WebP до 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Имя */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Имя специалиста *
              </label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Введите ваше имя"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.displayName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.displayName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.displayName}</p>
              )}
            </div>

            {/* Описание */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                О себе
                <span className="text-gray-500 text-sm ml-2">({formData.bio.length}/2000)</span>
              </label>
              <textarea
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Расскажите о своем опыте, образовании, подходах к работе..."
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.bio ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.bio && (
                <p className="mt-1 text-sm text-red-600">{formErrors.bio}</p>
              )}
            </div>

            {/* Опыт работы */}
            <div>
              <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-2">
                Опыт работы (лет)
              </label>
              <input
                type="number"
                id="experienceYears"
                value={formData.experienceYears}
                onChange={(e) => handleInputChange('experienceYears', Number(e.target.value))}
                min="0"
                max="50"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.experienceYears ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.experienceYears && (
                <p className="mt-1 text-sm text-red-600">{formErrors.experienceYears}</p>
              )}
            </div>

            {/* Формат работы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Формат работы
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="onlineOnly"
                    checked={formData.onlineOnly}
                    onChange={() => handleInputChange('onlineOnly', true)}
                    className="mr-2"
                  />
                  Только онлайн консультации
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="onlineOnly"
                    checked={!formData.onlineOnly}
                    onChange={() => handleInputChange('onlineOnly', false)}
                    className="mr-2"
                  />
                  Очные встречи (с указанием города)
                </label>
              </div>
            </div>

            {/* Город (только для очных встреч) */}
            {!formData.onlineOnly && (
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Город *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Введите город"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.city && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                )}
              </div>
            )}

            {/* Цены */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Стоимость за сессию (в долларах)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priceMin" className="block text-xs text-gray-500 mb-1">
                    От ($)
                  </label>
                  <input
                    type="number"
                    id="priceMin"
                    value={formData.priceMin}
                    onChange={(e) => handleInputChange('priceMin', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.priceMin ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.priceMin && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.priceMin}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="priceMax" className="block text-xs text-gray-500 mb-1">
                    До ($)
                  </label>
                  <input
                    type="number"
                    id="priceMax"
                    value={formData.priceMax}
                    onChange={(e) => handleInputChange('priceMax', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.priceMax ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.priceMax && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.priceMax}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Категории */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категории специализации
                <span className="text-gray-500 text-sm ml-2">(до 5 категорий)</span>
              </label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.slug} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.categorySlugs.includes(category.slug)}
                      onChange={(e) => {
                        const newSlugs = e.target.checked
                          ? [...formData.categorySlugs, category.slug]
                          : formData.categorySlugs.filter(slug => slug !== category.slug);
                        handleInputChange('categorySlugs', newSlugs);
                      }}
                      disabled={!formData.categorySlugs.includes(category.slug) && formData.categorySlugs.length >= 5}
                      className="mr-2"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
              {formErrors.categories && (
                <p className="mt-1 text-sm text-red-600">{formErrors.categories}</p>
              )}
            </div>

            {/* Статус верификации */}
            {profile?.verified === false && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Статус верификации:</strong> Будет установлен после модерации
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex justify-between items-center">
              <div>
                {profile && (
                  <a
                    href={`/app/specialists/${profile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Предпросмотр профиля →
                  </a>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Сохранение...' : 'Сохранить профиль'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditSpecialistProfilePage() {
  return (
    <Providers>
      <EditSpecialistProfilePageContent />
    </Providers>
  );
}
