import { useState } from 'react'
import { useTheme } from '../../../theme/useTheme'

function BrandingManager() {
  const { branding, refresh } = useTheme()
  const [form, setForm] = useState(null)
  const [loadedBranding, setLoadedBranding] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)

  if (branding && branding !== loadedBranding) {
    setLoadedBranding(branding)
    setForm(branding)
  }

  if (!form) return <p>Chargement…</p>

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const body = new FormData()
    body.append('file', file)

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        credentials: 'include',
        body,
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { url } = await res.json()
      setForm((prev) => ({ ...prev, logoUrl: url }))
    } catch (err) {
      setMessage(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMessage('Identité visuelle mise à jour')
      refresh()
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-section">
      <h2>Identité de la plateforme</h2>
      <p className="admin-section__hint">
        Le nom, le slogan et le logo sont utilisés partout sur le site public.
      </p>

      {message && <p className="admin-section__message">{message}</p>}

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Nom de la plateforme
          <input type="text" name="platformName" value={form.platformName} onChange={handleChange} />
        </label>

        <label>
          Slogan
          <input type="text" name="tagline" value={form.tagline ?? ''} onChange={handleChange} />
        </label>

        <label>
          Logo
          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
        </label>

        {form.logoUrl && (
          <img src={form.logoUrl} alt="Logo actuel" className="admin-logo-preview" />
        )}

        <button type="submit" disabled={saving || uploading}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}

export default BrandingManager
