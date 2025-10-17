'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase, Logo, CardTemplate } from '@/lib/supabase';
import Toast from '@/components/Toast';
import {
  Layers,
  Image as ImageIcon,
  CreditCard,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Move,
  Grid,
  Lock,
  Unlock
} from 'lucide-react';
import { KonvaEventObject } from 'konva/lib/Node';
import type { KonvaCanvasRef } from '@/components/KonvaCanvas';

// Dynamically import the KonvaCanvas wrapper to avoid SSR issues
const KonvaCanvas = dynamic(
  () => import('@/components/KonvaCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
);

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
  id: number;
}

// Standard credit card aspect ratio
const CARD_ASPECT_RATIO = 1.586; // Standard credit card ratio (85.6mm × 53.98mm)

export default function CardDesignerPage() {
  // State management
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);

  // Canvas state
  const [stageWidth, setStageWidth] = useState(600);
  const [stageHeight, setStageHeight] = useState(378); // 600 / 1.586
  const [logoPosition, setLogoPosition] = useState({ x: 60, y: 38 }); // 10% from top-left
  const [logoSize, setLogoSize] = useState({ width: 150, height: 150 }); // 25% of card width
  const [logoScale, setLogoScale] = useState(25); // Percentage of card width
  const [isSelected, setIsSelected] = useState(false);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  // UI state
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [mockupName, setMockupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Available items
  const [logos, setLogos] = useState<Logo[]>([]);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);

  // Refs
  const canvasRef = useRef<KonvaCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toast functions
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Load logos and templates on mount
  useEffect(() => {
    fetchLogos();
    fetchTemplates();
  }, []);


  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxWidth = Math.min(containerWidth - 40, 800); // Max 800px wide with padding
        setStageWidth(maxWidth);
        setStageHeight(maxWidth / CARD_ASPECT_RATIO);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch available logos
  const fetchLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('logos')
        .select('*')
        .order('company_name');

      if (error) throw error;
      setLogos(data || []);
    } catch (error) {
      console.error('Error fetching logos:', error);
      showToast('Failed to load logos', 'error');
    }
  };

  // Fetch available templates
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('card_templates')
        .select('*')
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Failed to load card templates', 'error');
    }
  };

  // Load logo image
  const loadLogoImage = (logo: Logo) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLogoImage(img);
      // Calculate initial size maintaining aspect ratio
      const initialWidth = stageWidth * (logoScale / 100);
      const aspectRatio = img.height / img.width;
      setLogoSize({
        width: initialWidth,
        height: initialWidth * aspectRatio
      });
    };
    img.src = logo.logo_url;
    setSelectedLogo(logo);
    setShowLogoSelector(false);
    setIsSelected(true);
  };

  // Load template image
  const loadTemplateImage = (template: CardTemplate) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setTemplateImage(img);
    };
    img.src = template.template_url;
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  // Handle drag end
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    setLogoPosition({
      x: e.target.x(),
      y: e.target.y()
    });
  };

  // Handle transform end
  const handleTransformEnd = () => {
    if (!canvasRef.current) return;

    const logoNode = canvasRef.current.getLogoNode();
    if (!logoNode) return;

    setLogoPosition({
      x: logoNode.x(),
      y: logoNode.y()
    });

    setLogoSize({
      width: logoNode.width(),
      height: logoNode.height()
    });

    // Update scale percentage
    setLogoScale(Math.round((logoNode.width() / stageWidth) * 100));
  };


  // Position control functions
  const moveLogo = (direction: 'up' | 'down' | 'left' | 'right', amount: number = 5) => {
    setLogoPosition(prev => {
      const newPos = { ...prev };
      switch (direction) {
        case 'up':
          newPos.y = Math.max(0, prev.y - amount);
          break;
        case 'down':
          newPos.y = Math.min(stageHeight - logoSize.height, prev.y + amount);
          break;
        case 'left':
          newPos.x = Math.max(0, prev.x - amount);
          break;
        case 'right':
          newPos.x = Math.min(stageWidth - logoSize.width, prev.x + amount);
          break;
      }
      return newPos;
    });
  };

  // Size control functions
  const updateLogoScale = (newScale: number) => {
    if (!logoImage) return;

    setLogoScale(newScale);
    const newWidth = stageWidth * (newScale / 100);
    const aspectRatio = logoImage.height / logoImage.width;

    setLogoSize({
      width: newWidth,
      height: keepAspectRatio ? newWidth * aspectRatio : logoSize.height
    });
  };

  // Preset position functions
  const setPresetPosition = (preset: string) => {
    const padding = stageWidth * 0.05; // 5% padding

    switch (preset) {
      case 'top-left':
        setLogoPosition({ x: padding, y: padding });
        break;
      case 'top-right':
        setLogoPosition({ x: stageWidth - logoSize.width - padding, y: padding });
        break;
      case 'bottom-left':
        setLogoPosition({ x: padding, y: stageHeight - logoSize.height - padding });
        break;
      case 'bottom-right':
        setLogoPosition({
          x: stageWidth - logoSize.width - padding,
          y: stageHeight - logoSize.height - padding
        });
        break;
      case 'center':
        setLogoPosition({
          x: (stageWidth - logoSize.width) / 2,
          y: (stageHeight - logoSize.height) / 2
        });
        break;
    }
  };

  // Save mockup
  const saveMockup = async () => {
    if (!mockupName.trim()) {
      showToast('Please enter a name for the mockup', 'error');
      return;
    }

    if (!selectedLogo || !selectedTemplate) {
      showToast('Please select both a logo and a card template', 'error');
      return;
    }

    if (!canvasRef.current) return;

    setSaving(true);
    try {
      // Temporarily hide grid and selection for clean export
      const wasShowingGrid = showGrid;
      const wasSelected = isSelected;

      // Hide UI elements
      if (wasShowingGrid) setShowGrid(false);
      if (wasSelected) setIsSelected(false);

      // Wait for state updates to render
      await new Promise(resolve => setTimeout(resolve, 50));

      // Generate image from canvas using clean export
      const dataURL = canvasRef.current.toDataURLClean({
        pixelRatio: 2, // 2x resolution for high quality
        mimeType: 'image/png'
      });

      // Restore UI elements
      if (wasShowingGrid) setShowGrid(true);
      if (wasSelected) setIsSelected(true);

      if (!dataURL) {
        throw new Error('Failed to generate image from canvas');
      }

      // Convert to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${mockupName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('card-mockups')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('card-mockups')
        .getPublicUrl(fileName);

      // Save to database
      const mockupData = {
        mockup_name: mockupName,
        logo_id: selectedLogo.id,
        template_id: selectedTemplate.id,
        logo_x: (logoPosition.x / stageWidth) * 100, // Save as percentage
        logo_y: (logoPosition.y / stageHeight) * 100,
        logo_scale: logoScale,
        mockup_image_url: publicUrl
      };

      const { error: dbError } = await supabase
        .from('card_mockups')
        .insert(mockupData);

      if (dbError) throw dbError;

      showToast('Mockup saved successfully!', 'success');
      // Reset form
      setMockupName('');
    } catch (error) {
      console.error('Error saving mockup:', error);
      showToast('Failed to save mockup', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Asset Designer</h2>
        <p className="text-gray-600 mb-6">Create custom asset mockups with your logos</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Selection Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Elements
              </h3>

              {/* Logo Selection */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">Logo</label>
                <button
                  onClick={() => setShowLogoSelector(true)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {selectedLogo ? selectedLogo.company_name : 'Select Logo'}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Template Selection */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Asset Template</label>
                <button
                  onClick={() => setShowTemplateSelector(true)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {selectedTemplate ? selectedTemplate.template_name : 'Select Template'}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Position Controls */}
            {selectedLogo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Position
                </h3>

                {/* Arrow Controls */}
                <div className="grid grid-cols-3 gap-1 mb-3">
                  <div />
                  <button
                    onClick={() => moveLogo('up')}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4 mx-auto" />
                  </button>
                  <div />
                  <button
                    onClick={() => moveLogo('left')}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => setPresetPosition('center')}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => moveLogo('right')}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 mx-auto" />
                  </button>
                  <div />
                  <button
                    onClick={() => moveLogo('down')}
                    className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4 mx-auto" />
                  </button>
                  <div />
                </div>

                {/* Preset Positions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPresetPosition('top-left')}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Top Left
                  </button>
                  <button
                    onClick={() => setPresetPosition('top-right')}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Top Right
                  </button>
                  <button
                    onClick={() => setPresetPosition('bottom-left')}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Bottom Left
                  </button>
                  <button
                    onClick={() => setPresetPosition('bottom-right')}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Bottom Right
                  </button>
                </div>
              </div>
            )}

            {/* Size Controls */}
            {selectedLogo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Size</h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm text-gray-600">Logo Size</label>
                      <span className="text-sm font-medium">{logoScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={logoScale}
                      onChange={(e) => updateLogoScale(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setKeepAspectRatio(!keepAspectRatio)}
                      className="flex items-center gap-2 text-sm"
                    >
                      {keepAspectRatio ? (
                        <Lock className="h-4 w-4 text-[#374151]" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-400" />
                      )}
                      Aspect Ratio
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Aids */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Visual Aids</h3>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showGrid ? 'bg-[#e5e7eb] text-[#1f2937]' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Grid className="h-4 w-4" />
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
            </div>

            {/* Save Section */}
            {selectedLogo && selectedTemplate && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Save Mockup</h3>
                <input
                  type="text"
                  value={mockupName}
                  onChange={(e) => setMockupName(e.target.value)}
                  placeholder="Enter mockup name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] mb-3"
                />
                <button
                  onClick={saveMockup}
                  disabled={saving || !mockupName.trim()}
                  className="w-full px-4 py-2 bg-[#374151] text-white rounded-lg hover:bg-[#1f2937] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Mockup
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div ref={containerRef} className="flex justify-center">
                {selectedTemplate ? (
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <KonvaCanvas
                      ref={canvasRef}
                      width={stageWidth}
                      height={stageHeight}
                      templateImage={templateImage}
                      logoImage={logoImage}
                      logoPosition={logoPosition}
                      logoSize={logoSize}
                      isSelected={isSelected}
                      showGrid={showGrid}
                      keepAspectRatio={keepAspectRatio}
                      onDragEnd={handleDragEnd}
                      onTransformEnd={handleTransformEnd}
                      onClick={() => setIsSelected(true)}
                      onDeselect={() => setIsSelected(false)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <CreditCard className="h-16 w-16 mb-4" />
                    <p>Select an asset template to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logo Selector Modal */}
        {showLogoSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">Select a Logo</h3>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {logos.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => loadLogoImage(logo)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#374151] hover:shadow-md transition-all"
                    >
                      <img
                        src={logo.logo_url}
                        alt={logo.company_name}
                        className="w-full h-20 object-contain mb-2"
                      />
                      <p className="text-sm text-gray-700 truncate">{logo.company_name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t">
                <button
                  onClick={() => setShowLogoSelector(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-xl font-semibold">Select an Asset Template</h3>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplateImage(template)}
                      className="border border-gray-200 rounded-lg hover:border-[#374151] hover:shadow-md transition-all overflow-hidden"
                    >
                      <img
                        src={template.template_url}
                        alt={template.template_name}
                        className="w-full h-32 object-cover"
                      />
                      <p className="p-2 text-sm text-gray-700 truncate">{template.template_name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t">
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}