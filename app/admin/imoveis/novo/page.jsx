'use client';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { upload } from '@vercel/blob/client';
import { addWatermark } from '@/lib/imageUtils';
import { fetchAddressByCep } from '@/lib/address';
import AdminHeader from '@/app/components/admin/AdminHeader';
import FormStepper from '@/app/components/admin/FormStepper';
import AddressMapPicker from '@/app/components/admin/AddressMapPicker';
import './page.css';

export default function NewProperty() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    transactionType: 'Venda',
    category: '',
    price: '',
    condoFee: '',
    iptu: '',
    bedrooms: '',
    suites: '',
    bathrooms: '',
    parkingSpaces: '',
    usableArea: '',
    totalArea: '',
  });

  // Address State
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    number: '',
    complement: ''
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [coords, setCoords] = useState(null); // { latitude, longitude } | null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setCep(value);
  };

  const handleCepBlur = async () => {
    if (cep.length < 9) return;

    setIsLoadingCep(true);
    const data = await fetchAddressByCep(cep);
    setIsLoadingCep(false);

    if (data) {
      setAddress(prev => ({
        ...prev,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state
      }));
    }
  };

  const handleAddressChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateLocationStep = () => {
    const required = [
      ['cep', cep.replace(/\D/g, '')],
      ['city', address.city],
      ['state', address.state],
      ['neighborhood', address.neighborhood],
      ['street', address.street],
      ['number', address.number],
    ];
    const missing = required.find(([, value]) => !value || !String(value).trim());
    if (missing) {
      const labels = { cep: 'CEP', city: 'Cidade', state: 'UF', neighborhood: 'Bairro', street: 'Logradouro', number: 'Número' };
      alert(`Preencha o campo obrigatório: ${labels[missing[0]]}`);
      return false;
    }
    if (!coords) {
      alert('Defina a localização no mapa antes de prosseguir.');
      return false;
    }
    return true;
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newFiles = [];

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      const isVideo = file.type.startsWith('video/');

      try {
        let processedFile = file;
        if (!isVideo) {
          processedFile = await addWatermark(file, '/watermark.png');
        }
        const previewUrl = URL.createObjectURL(processedFile);
        newFiles.push({
          file: processedFile,
          preview: previewUrl,
          type: isVideo ? 'video' : 'image',
          id: Date.now() + Math.random().toString(36).substr(2, 9)
        });
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setImages(prev => [...prev, ...newFiles]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id) => {
    setImages(prev => prev.filter(item => item.id !== id));
  };

  const nextStep = () => {
    if (currentStep === 2 && !validateLocationStep()) return;
    setCurrentStep(prev => prev + 1);
  };
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // 1) Vídeos sobem direto pro Vercel Blob (contornam o cap de 4.5MB
      //    de payload das Functions). Recebem URL pública usável.
      const videoItems = images.filter((item) => item.type === 'video');
      const videoUrls = [];
      for (const item of videoItems) {
        const blob = await upload(item.file.name, item.file, {
          access: 'public',
          handleUploadUrl: '/api/properties/upload-token',
        });
        videoUrls.push(blob.url);
      }

      // 2) Imagens vão por multipart pra Function (já com validação de
      //    magic bytes + watermark aplicado no client).
      const data = new FormData();
      Object.entries({ ...formData, ...address, cep: cep.replace(/\D/g, '') }).forEach(([key, value]) => {
        data.append(key, value || '');
      });

      if (coords) {
        data.append('latitude', String(coords.latitude));
        data.append('longitude', String(coords.longitude));
      }

      images.filter((item) => item.type !== 'video').forEach((img) => {
        data.append('images', img.file);
      });

      data.append('videos', JSON.stringify(videoUrls));

      const res = await fetch('/api/properties', {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        router.push('/admin/imoveis');
      } else {
        const error = await res.json();
        alert('Erro ao salvar imóvel: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar imóvel. Tente novamente.');
    }
    setIsSaving(false);
  };

  return (
    <>
      <AdminHeader
        title="Cadastrar Novo Imóvel"
        subtitle="Preencha as informações abaixo para publicar um novo imóvel."
        backLink="/admin/imoveis"
        backLinkText="Imóveis"
        breadcrumbTitle="Novo"
      />

      <div className="admin-stepper-container admin-stepper-form">

        {/* Stepper Header */}
        <FormStepper
          steps={[
            { label: 'Sobre' },
            { label: 'Local' },
            { label: 'Detalhes' },
            { label: 'Valores' },
            { label: 'Mídia' }
          ]}
          currentStep={currentStep}
        />

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Título do Anúncio</label>
              <div className="input-wrapper">
                <input type="text" className="form-input" placeholder="Ex: Casa de Alto Padrão no Jardins" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descrição</label>
              <textarea className="form-textarea" placeholder="Descreva os detalhes..." rows="4" value={formData.description} onChange={(e) => handleChange('description', e.target.value)}></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={formData.transactionType} onChange={(e) => handleChange('transactionType', e.target.value)}>
                <option value="Venda">Venda</option>
                <option value="Aluguel">Aluguel</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={formData.category} onChange={(e) => handleChange('category', e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <h4 className="form-section-title" style={{ marginTop: 0 }}>Endereço do Imóvel</h4>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 2fr 0.6fr 2fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">CEP *</label>
                <div className="input-wrapper">
                  <input type="text" className="form-input" placeholder="00000-000" value={cep} onChange={handleCepChange} onBlur={handleCepBlur} maxLength={9} required />
                  {isLoadingCep && <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '12px', color: '#666' }}>Buscando...</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cidade *</label>
                <input type="text" className="form-input" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">UF *</label>
                <input type="text" className="form-input" value={address.state} onChange={(e) => handleAddressChange('state', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="SP" required />
              </div>
              <div className="form-group">
                <label className="form-label">Bairro *</label>
                <div className="input-wrapper">
                  <input type="text" className="form-input" value={address.neighborhood} onChange={(e) => handleAddressChange('neighborhood', e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Logradouro *</label>
              <div className="input-wrapper">
                <input type="text" className="form-input" placeholder="Rua, Avenida, etc" value={address.street} onChange={(e) => handleAddressChange('street', e.target.value)} required />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Número *</label>
              <input type="text" className="form-input" value={address.number} onChange={(e) => handleAddressChange('number', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Complemento</label>
              <input type="text" className="form-input" value={address.complement} onChange={(e) => handleAddressChange('complement', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <AddressMapPicker
                address={{ ...address, cep: cep.replace(/\D/g, '') }}
                value={coords}
                onChange={setCoords}
              />
            </div>
          </div>
        )}
        {/* Step 3: Features */}
        {currentStep === 3 && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <h4 className="form-section-title" style={{ marginTop: 0 }}>Características Principais</h4>
            </div>

            <div className="form-grid cols-2" style={{ gridColumn: '1 / -1', gap: '20px', marginBottom: '32px' }}>
              <div className="form-group">
                <label className="form-label">Quartos</label>
                <input type="number" className="form-input" placeholder="0" value={formData.bedrooms} onChange={(e) => handleChange('bedrooms', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Suítes</label>
                <input type="number" className="form-input" placeholder="0" value={formData.suites} onChange={(e) => handleChange('suites', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Banheiros</label>
                <input type="number" className="form-input" placeholder="0" value={formData.bathrooms} onChange={(e) => handleChange('bathrooms', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Vagas</label>
                <input type="number" className="form-input" placeholder="0" value={formData.parkingSpaces} onChange={(e) => handleChange('parkingSpaces', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Área Útil</label>
                <div className="input-wrapper">
                  <input type="text" inputMode="decimal" className="form-input" placeholder="0" value={formData.usableArea} onChange={(e) => handleChange('usableArea', e.target.value)} />
                  <span className="input-suffix">m²</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Área Total</label>
                <div className="input-wrapper">
                  <input type="text" inputMode="decimal" className="form-input" placeholder="0" value={formData.totalArea} onChange={(e) => handleChange('totalArea', e.target.value)} />
                  <span className="input-suffix">m²</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Investment */}
        {currentStep === 4 && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <h4 className="form-section-title" style={{ marginTop: 0, textAlign: 'center' }}>Investimento</h4>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '32px' }}>
              <div className="form-group" style={{ flex: '0 1 300px' }}>
                <label className="form-label">Preço</label>
                <div className="input-wrapper">
                  <span className="input-prefix">R$</span>
                  <input type="text" inputMode="decimal" className="form-input" placeholder="0,00" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ flex: '0 1 300px' }}>
                <label className="form-label">Condomínio</label>
                <div className="input-wrapper">
                  <span className="input-prefix">R$</span>
                  <input type="text" inputMode="decimal" className="form-input" placeholder="0,00" value={formData.condoFee} onChange={(e) => handleChange('condoFee', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ flex: '0 1 300px' }}>
                <label className="form-label">IPTU</label>
                <div className="input-wrapper">
                  <span className="input-prefix">R$</span>
                  <input type="text" inputMode="decimal" className="form-input" placeholder="0,00" value={formData.iptu} onChange={(e) => handleChange('iptu', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Media */}
        {currentStep === 5 && (
          <div>
            <h4 className="form-section-title" style={{ marginTop: 0 }}>Fotos e Vídeos</h4>
            <p style={{ color: 'var(--admin-text-secondary)', marginBottom: '20px' }}>
              Adicione fotos de alta qualidade. A primeira foto será a capa.
            </p>

            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*,video/*" multiple style={{ display: 'none' }} />

            <div className="dropzone" onClick={() => fileInputRef.current?.click()} style={{ cursor: isProcessing ? 'wait' : 'pointer' }}>
              <div style={{ background: '#f3f4f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-text-secondary)' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {isProcessing ? 'Processando...' : 'Clique para selecionar fotos'}
              </p>
            </div>

            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginTop: '24px' }}>
                {images.map((item) => (
                  <div key={item.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', background: '#f3f4f6' }}>
                    {item.type === 'video' ? (
                      <video src={item.preview} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Image src={item.preview} alt="Preview" fill unoptimized style={{ objectFit: 'cover' }} />
                    )}
                    <button onClick={() => removeFile(item.id)} style={{ position: 'absolute', top: 6, right: 6, background: 'white', borderRadius: '50%', border: 'none', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="form-actions">
          {currentStep > 1 ? (
            <button onClick={prevStep} className="nav-btn prev-btn">Voltar</button>
          ) : (
            <Link href="/admin/imoveis" className="nav-btn prev-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cancelar</Link>
          )}

          {currentStep < 5 ? (
            <button onClick={nextStep} className="nav-btn next-btn">Próximo</button>
          ) : (
            <button className="nav-btn next-btn" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Finalizar Imóvel'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
