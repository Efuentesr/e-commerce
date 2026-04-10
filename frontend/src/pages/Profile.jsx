import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, updateUser } = useAuth()

  // Datos personales
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [datosMsg, setDatosMsg] = useState('')
  const [datosError, setDatosError] = useState('')
  const [datosLoading, setDatosLoading] = useState(false)

  // Contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const handleDatos = async (e) => {
    e.preventDefault()
    setDatosMsg('')
    setDatosError('')
    setDatosLoading(true)
    try {
      await updateUser({ email, phone })
      setDatosMsg('Datos actualizados correctamente.')
    } catch (err) {
      const data = err.response?.data
      setDatosError(
        data?.email?.[0] || data?.phone?.[0] || data?.detail || 'Error al guardar los datos.'
      )
    } finally {
      setDatosLoading(false)
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setPassMsg('')
    setPassError('')
    setPassLoading(true)
    try {
      await updateUser({ current_password: currentPassword, new_password: newPassword, new_password_confirm: newPasswordConfirm })
      setPassMsg('Contraseña actualizada correctamente.')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err) {
      const data = err.response?.data
      setPassError(
        data?.current_password?.[0] ||
        data?.new_password?.[0] ||
        data?.new_password_confirm?.[0] ||
        data?.non_field_errors?.[0] ||
        'Error al cambiar la contraseña.'
      )
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {/* Datos personales */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">Datos personales</h2>
        <form onSubmit={handleDatos} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-amazon-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +5491123456789"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-amazon-orange"
            />
          </div>
          {datosError && <p className="text-red-500 text-sm">{datosError}</p>}
          {datosMsg   && <p className="text-amazon-teal text-sm font-medium">{datosMsg}</p>}
          <button
            type="submit"
            disabled={datosLoading}
            className="btn-primary disabled:opacity-50"
          >
            {datosLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cambio de contraseña */}
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-amazon-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-amazon-orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-amazon-orange"
            />
          </div>
          {passError && <p className="text-red-500 text-sm">{passError}</p>}
          {passMsg   && <p className="text-amazon-teal text-sm font-medium">{passMsg}</p>}
          <button
            type="submit"
            disabled={passLoading}
            className="btn-primary disabled:opacity-50"
          >
            {passLoading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
