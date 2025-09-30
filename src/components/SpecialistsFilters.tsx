"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { Select, Radio, Checkbox } from './ui'

interface FilterState {
  category: string
  format: string
  city: string
  minExp: string
  priceMin: string
  priceMax: string
  q: string
  verifiedOnly: boolean
  offset: number
}

const CATEGORIES = [
  { value: '', label: 'Все категории' },
  { value: 'psychologist', label: 'Психолог' },
  { value: 'nutritionist', label: 'Нутрициолог' },
  { value: 'personal-trainer', label: 'Персональный тренер' },
  { value: 'health-coach', label: 'Здоровье-коуч' },
  { value: 'physiotherapist', label: 'Физиотерапевт' },
]

const CITIES = [
  { value: '', label: 'Любой город' },
  { value: 'Москва', label: 'Москва' },
  { value: 'Санкт-Петербург', label: 'Санкт-Петербург' },
  { value: 'Новосибирск', label: 'Новосибирск' },
  { value: 'Екатеринбург', label: 'Екатеринбург' },
  { value: 'Казань', label: 'Казань' },
]

export default function SpecialistsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    format: 'any',
    city: '',
    minExp: '',
    priceMin: '',
    priceMax: '',
    q: '',
    verifiedOnly: true,
    offset: 0,
  })

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Debounced search query
  const debouncedSearchQuery = useDebounce(filters.q, 300)

  // Initialize filters from URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    setFilters({
      category: params.get('category') || '',
      format: params.get('format') || 'any',
      city: params.get('city') || '',
      minExp: params.get('minExp') || '',
      priceMin: params.get('priceMin') || '',
      priceMax: params.get('priceMax') || '',
      q: params.get('q') || '',
      verifiedOnly: params.get('verifiedOnly') !== 'false',
      offset: parseInt(params.get('offset') || '0'),
    })
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback((newFilters: Partial<FilterState>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Reset offset when filters change (except when offset itself changes)
    if (!('offset' in newFilters)) {
      newFilters.offset = 0
    }

    // Update all filter parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    // Remove default values to keep URL clean
    if (params.get('format') === 'any') params.delete('format')
    if (params.get('verifiedOnly') === 'true') params.delete('verifiedOnly')
    if (params.get('offset') === '0') params.delete('offset')

    const newURL = params.toString() ? `?${params.toString()}` : ''
    router.push(`/specialists${newURL}`, { scroll: false })
  }, [router, searchParams])

  // Handle search with debounce
  useEffect(() => {
    if (debouncedSearchQuery !== filters.q) return
    
    updateURL({ q: debouncedSearchQuery })
  }, [debouncedSearchQuery, filters.q, updateURL])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // For search, don't update URL immediately (debounced)
    if (key === 'q') return
    
    updateURL({ [key]: value })
  }

  const handleReset = () => {
    setFilters({
      category: '',
      format: 'any',
      city: '',
      minExp: '',
      priceMin: '',
      priceMax: '',
      q: '',
      verifiedOnly: true,
      offset: 0,
    })
    router.push('/specialists', { scroll: false })
  }

  const handlePagination = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'prev' 
      ? Math.max(0, filters.offset - 20)
      : filters.offset + 20
    
    updateURL({ offset: newOffset })
  }

  const FilterSection = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div className="space-y-4">
      <h3 className="text-heading-4">{title}</h3>
      {children}
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="btn btn-secondary w-full"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Фильтры
        </button>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block card-elevated p-6 mb-8 specialists-filters">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-3">Фильтры</h2>
          <button
            onClick={handleReset}
            className="btn-outline btn-sm"
          >
            Сбросить
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Search */}
          <FilterSection title="Поиск">
            <input
              type="text"
              placeholder="Поиск по имени или специализации..."
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
            />
          </FilterSection>

          {/* Category */}
          <FilterSection title="Категория">
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              options={CATEGORIES}
              placeholder="Все категории"
            />
          </FilterSection>

          {/* Format */}
          <FilterSection title="Формат работы">
            <div className="space-y-2">
              {[
                { value: 'any', label: 'Любой' },
                { value: 'online', label: 'Только онлайн' },
                { value: 'offline', label: 'Только офлайн' },
              ].map((option) => (
                <Radio
                  key={option.value}
                  name="format"
                  value={option.value}
                  checked={filters.format === option.value}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                  label={option.label}
                />
              ))}
            </div>
          </FilterSection>

          {/* City (only for offline) */}
          {filters.format === 'offline' && (
            <FilterSection title="Город">
              <Select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                options={CITIES}
                placeholder="Любой город"
              />
            </FilterSection>
          )}

          {/* Experience */}
          <FilterSection title="Минимальный опыт (лет)">
            <input
              type="number"
              min="0"
              placeholder="От"
              value={filters.minExp}
              onChange={(e) => handleFilterChange('minExp', e.target.value)}
              className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
            />
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Цена за сессию ($)">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                placeholder="От"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
              />
              <input
                type="number"
                min="0"
                placeholder="До"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
              />
            </div>
          </FilterSection>
        </div>

        {/* Additional Filters */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Checkbox
            id="verifiedOnly"
            checked={filters.verifiedOnly}
            onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
            label="Только верифицированные специалисты"
          />
        </div>
      </div>

      {/* Mobile Slide-over */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl specialists-filters">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-heading-3">Фильтры</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="btn-ghost btn-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-6">
                  {/* Search */}
                  <FilterSection title="Поиск">
                    <input
                      type="text"
                      placeholder="Поиск по имени или специализации..."
                      value={filters.q}
                      onChange={(e) => handleFilterChange('q', e.target.value)}
                      className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    />
                  </FilterSection>

                  {/* Category */}
                  <FilterSection title="Категория">
                    <Select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      options={CATEGORIES}
                      placeholder="Все категории"
                    />
                  </FilterSection>

                  {/* Format */}
                  <FilterSection title="Формат работы">
                    <div className="space-y-2">
                      {[
                        { value: 'any', label: 'Любой' },
                        { value: 'online', label: 'Только онлайн' },
                        { value: 'offline', label: 'Только офлайн' },
                      ].map((option) => (
                        <Radio
                          key={option.value}
                          name="format"
                          value={option.value}
                          checked={filters.format === option.value}
                          onChange={(e) => handleFilterChange('format', e.target.value)}
                          label={option.label}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  {/* City (only for offline) */}
                  {filters.format === 'offline' && (
                    <FilterSection title="Город">
                      <Select
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        options={CITIES}
                        placeholder="Любой город"
                      />
                    </FilterSection>
                  )}

                  {/* Experience */}
                  <FilterSection title="Минимальный опыт (лет)">
                    <input
                      type="number"
                      min="0"
                      placeholder="От"
                      value={filters.minExp}
                      onChange={(e) => handleFilterChange('minExp', e.target.value)}
                      className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                    />
                  </FilterSection>

                  {/* Price Range */}
                  <FilterSection title="Цена за сессию ($)">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="От"
                        value={filters.priceMin}
                        onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                        className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="До"
                        value={filters.priceMax}
                        onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                        className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2"
                      />
                    </div>
                  </FilterSection>

                  {/* Verified Only */}
                  <FilterSection title="Дополнительно">
                    <Checkbox
                      id="mobileVerifiedOnly"
                      checked={filters.verifiedOnly}
                      onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                      label="Только верифицированные специалисты"
                    />
                  </FilterSection>
                </div>
              </div>

              <div className="border-t border-gray-200 px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary flex-1"
                  >
                    Сбросить
                  </button>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="btn btn-primary flex-1"
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
