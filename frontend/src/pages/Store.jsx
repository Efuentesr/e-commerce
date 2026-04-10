import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'

export default function Store() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null })
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const categorySlug = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const ordering = searchParams.get('ordering') || '-created_at'
  const page = parseInt(searchParams.get('page') || '1')

  // Cargar categorías al montar
  useEffect(() => {
    api.get('/products/categories/').then(({ data }) => setCategories(data))
  }, [])

  // Cargar productos al cambiar filtros
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (search) params.set('search', search)
    if (ordering) params.set('ordering', ordering)
    params.set('page', page)

    api.get(`/products/products/?${params}`)
      .then(({ data }) => {
        setProducts(data.results || data)
        setPagination({ count: data.count, next: data.next, previous: data.previous })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [categorySlug, search, ordering, page])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')  // Solo resetear página al cambiar filtros
    setSearchParams(next)
  }

  const totalPages = Math.ceil(pagination.count / 20)

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 flex gap-6">
      {/* Sidebar de categorías */}
      <aside className="hidden md:block w-48 flex-shrink-0">
        <h2 className="font-bold text-gray-700 mb-3">Categorías</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setFilter('category', '')}
              className={`w-full text-left px-2 py-1 rounded transition-colors ${!categorySlug ? 'bg-amazon-orange text-amazon-blue font-semibold' : 'hover:bg-gray-200'}`}
            >
              Todas
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => setFilter('category', cat.slug)}
                className={`w-full text-left px-2 py-1 rounded transition-colors ${categorySlug === cat.slug ? 'bg-amazon-orange text-amazon-blue font-semibold' : 'hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>

        <h2 className="font-bold text-gray-700 mt-6 mb-3">Ordenar por</h2>
        <ul className="space-y-1 text-sm">
          {[
            ['-created_at', 'Más recientes'],
            ['price', 'Precio: menor a mayor'],
            ['-price', 'Precio: mayor a menor'],
            ['name', 'Nombre A-Z'],
          ].map(([val, label]) => (
            <li key={val}>
              <button
                onClick={() => setFilter('ordering', val)}
                className={`w-full text-left px-2 py-1 rounded transition-colors ${ordering === val ? 'bg-amazon-orange text-amazon-blue font-semibold' : 'hover:bg-gray-200'}`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Grid de productos */}
      <div className="flex-1">
        {/* Encabezado de resultados + botón filtros mobile */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-sm text-gray-600">
            {loading ? 'Buscando...' : `${pagination.count} resultado${pagination.count !== 1 ? 's' : ''}`}
            {search && <span> para "<strong>{search}</strong>"</span>}
            {categorySlug && <span> en <strong>{categories.find(c => c.slug === categorySlug)?.name || categorySlug}</strong></span>}
          </p>
          <button
            onClick={() => setShowMobileFilters((v) => !v)}
            className="md:hidden flex items-center gap-1 text-sm border border-gray-300 rounded px-3 py-1 bg-white text-gray-700 hover:bg-gray-50 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtros
          </button>
        </div>

        {/* Panel de filtros mobile */}
        {showMobileFilters && (
          <div className="md:hidden bg-white border rounded-lg p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-bold text-gray-700 mb-2">Categoría</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => { setFilter('category', ''); setShowMobileFilters(false) }}
                      className={`w-full text-left px-2 py-1 rounded transition-colors ${!categorySlug ? 'bg-amazon-orange text-amazon-blue font-semibold' : 'hover:bg-gray-100'}`}
                    >
                      Todas
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <button
                        onClick={() => { setFilter('category', cat.slug); setShowMobileFilters(false) }}
                        className={`w-full text-left px-2 py-1 rounded transition-colors ${categorySlug === cat.slug ? 'bg-amazon-orange text-amazon-blue font-semibold' : 'hover:bg-gray-100'}`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-700 mb-2">Ordenar por</h3>
                <ul className="space-y-1">
                  {[
                    ['-created_at', 'Más recientes'],
                    ['price', 'Menor precio'],
                    ['-price', 'Mayor precio'],
                    ['name', 'Nombre A-Z'],
                  ].map(([val, label]) => (
                    <li key={val}>
                      <button
                        onClick={() => { setFilter('ordering', val); setShowMobileFilters(false) }}
                        className={`w-full text-left px-2 py-1 rounded transition-colors ${ordering === val ? 'bg-amazon-orange text-amazon-blue font-semibold' : 'hover:bg-gray-100'}`}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded shadow h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No se encontraron productos.</p>
            <button onClick={() => setSearchParams({})} className="mt-4 btn-secondary text-sm">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
            {/* Anterior */}
            <button
              disabled={page === 1}
              onClick={() => setFilter('page', page - 1)}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-40"
            >
              ←
            </button>

            {/* Números de página con ventana deslizante */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                // Insertar "..." cuando hay saltos
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setFilter('page', p)}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      p === page
                        ? 'bg-amazon-orange border-amazon-orange text-amazon-blue font-bold'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            {/* Siguiente */}
            <button
              disabled={page === totalPages}
              onClick={() => setFilter('page', page + 1)}
              className="btn-secondary px-3 py-1 text-sm disabled:opacity-40"
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
