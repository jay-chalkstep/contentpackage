'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useOrganization, useUser } from '@clerk/nextjs';
import { supabase, Logo, CardTemplate, Folder, Project } from '@/lib/supabase';
import { buildFolderTree } from '@/lib/folders';
import Toast from '@/components/Toast';
import GmailLayout from '@/components/layout/GmailLayout';
import FolderSelector from '@/components/folders/FolderSelector';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
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
  Unlock,
  ArrowLeft
} from 'lucide-react';
import { KonvaEventObject } from 'konva/lib/Node';
import type { KonvaCanvasRef } from '@/components/designer/KonvaCanvas';

// Dynamically import the KonvaCanvas wrapper to avoid SSR issues
const KonvaCanvas = dynamic(
  () => import('@/components/designer/KonvaCanvas'),
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

interface BrandGroup {
  id: string;
  company_name: string;
  domain: string;
  description?: string;
  primary_logo_variant_id?: string;
  variants: Logo[];
  variantCount: number;
  primaryVariant?: Logo;
}

// Standard credit card aspect ratio
const CARD_ASPECT_RATIO = 1.586; // Standard credit card ratio (85.6mm × 53.98mm)

// Helper function to get format badge color
const getFormatColor = (format?: string) => {
  switch (format?.toLowerCase()) {
    case 'svg':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'png':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'jpg':
    case 'jpeg':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Helper function to get type badge color
const getTypeColor = (type?: string) => {
  switch (type?.toLowerCase()) {
    case 'icon':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'logo':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'symbol':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function DesignerPage() {
  const { organization, isLoaded } = useOrganization();
  const { user } = useUser();

  // State management
  const [selectedBrand, setSelectedBrand] = useState<Logo | null>(null);
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
  const [brandGroups, setBrandGroups] = useState<BrandGroup[]>([]);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);

  // Folder state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

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

  // Load logos, templates, folders, and projects when organization loads
  useEffect(() => {
    if (organization?.id && user?.id) {
      fetchLogos();
      fetchTemplates();
      fetchFolders();
      fetchProjects();
    }
  }, [organization?.id, user?.id]);


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

  // Fetch available logos from brands and logo_variants
  const fetchLogos = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('brands')
        .select(`
          *,
          logo_variants!brand_id(*)
        `)
        .eq('organization_id', organization.id)
        .order('company_name');

      if (error) throw error;

      // Flatten logo variants into Logo format for backward compatibility
      const flattenedLogos: Logo[] = [];
      const groups: BrandGroup[] = [];

      (data || []).forEach((brand: any) => {
        if (brand.logo_variants && brand.logo_variants.length > 0) {
          const variants: Logo[] = [];

          brand.logo_variants.forEach((variant: any) => {
            const logoVariant: Logo = {
              id: variant.id,
              company_name: brand.company_name,
              domain: brand.domain,
              description: brand.description,
              logo_url: variant.logo_url,
              logo_type: variant.logo_type,
              logo_format: variant.logo_format,
              theme: variant.theme,
              width: variant.width,
              height: variant.height,
              file_size: variant.file_size,
              background_color: variant.background_color,
              accent_color: variant.accent_color,
              is_uploaded: variant.is_uploaded,
              created_at: variant.created_at,
              updated_at: variant.updated_at,
            };

            flattenedLogos.push(logoVariant);
            variants.push(logoVariant);
          });

          // Find primary variant
          const primaryVariant = variants.find(v => v.id === brand.primary_logo_variant_id) || variants[0];

          // Create brand group
          groups.push({
            id: brand.id,
            company_name: brand.company_name,
            domain: brand.domain,
            description: brand.description,
            primary_logo_variant_id: brand.primary_logo_variant_id,
            variants: variants,
            variantCount: variants.length,
            primaryVariant: primaryVariant,
          });
        }
      });

      setLogos(flattenedLogos);
      setBrandGroups(groups);
    } catch (error) {
      console.error('Error fetching logos:', error);
      showToast('Failed to load logos', 'error');
    }
  };

  // Fetch available templates
  const fetchTemplates = async () => {
    if (!organization?.id) return;

    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');

      const { templates: fetchedTemplates } = await response.json();
      setTemplates(fetchedTemplates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Failed to load card templates', 'error');
    }
  };

  // Fetch available folders
  const fetchFolders = async () => {
    if (!organization?.id || !user?.id) return;

    try {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');

      const { folders: fetchedFolders } = await response.json();
      const folderTree = buildFolderTree(fetchedFolders);
      setFolders(folderTree);
    } catch (error) {
      console.error('Error fetching folders:', error);
      // Don't show error toast for folders - it's optional functionality
    }
  };

  // Fetch available projects
  const fetchProjects = async () => {
    if (!organization?.id) return;

    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');

      const { projects: fetchedProjects } = await response.json();
      setProjects(fetchedProjects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Don't show error toast for projects - it's optional functionality
    }
  };

  // Handle create folder
  const handleCreateFolder = async (name: string) => {
    if (!organization?.id || !user?.id) return;

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create folder');
      }

      showToast('Folder created successfully', 'success');
      fetchFolders(); // Refresh folder list
    } catch (error) {
      throw error; // Let modal handle the error
    }
  };

  // Load logo image
  const loadBrandImage = (logo: Logo) => {
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
    setSelectedBrand(logo);
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

    if (!selectedBrand || !selectedTemplate) {
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

      // Prepare form data for API
      const formData = new FormData();
      formData.append('image', blob);
      formData.append('mockupName', mockupName);
      formData.append('logoId', selectedBrand.id);
      formData.append('templateId', selectedTemplate.id);
      if (selectedFolderId) formData.append('folderId', selectedFolderId);
      if (selectedProjectId) formData.append('projectId', selectedProjectId);
      formData.append('logoX', ((logoPosition.x / stageWidth) * 100).toString());
      formData.append('logoY', ((logoPosition.y / stageHeight) * 100).toString());
      formData.append('logoScale', logoScale.toString());

      // Save via API
      const apiResponse = await fetch('/api/mockups', {
        method: 'POST',
        body: formData
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to save mockup');
      }

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
    <GmailLayout>
      <div className="max-w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Asset Designer</h2>
        <p className="text-gray-600 mb-6">Create custom assets with your brands</p>

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
                <label className="text-sm text-gray-600 mb-2 block">Brand</label>
                <button
                  onClick={() => setShowLogoSelector(true)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {selectedBrand ? selectedBrand.company_name : 'Select Brand'}
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
            {selectedBrand && (
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
            {selectedBrand && (
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
            {selectedBrand && selectedTemplate && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Save Mockup</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Mockup Name</label>
                    <input
                      type="text"
                      value={mockupName}
                      onChange={(e) => setMockupName(e.target.value)}
                      placeholder="Enter mockup name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Folder (Optional)</label>
                    <FolderSelector
                      folders={folders}
                      selectedFolderId={selectedFolderId}
                      onSelect={setSelectedFolderId}
                      onCreateFolder={() => setShowCreateFolderModal(true)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Project (Optional)</label>
                    <select
                      value={selectedProjectId || ''}
                      onChange={(e) => setSelectedProjectId(e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#374151] text-sm"
                    >
                      <option value="">No project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
              <div className="p-6 border-b flex items-center justify-between">
                {expandedBrand ? (
                  <>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedBrand(null)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                      </button>
                      <h3 className="text-xl font-semibold">
                        {brandGroups.find(b => b.id === expandedBrand)?.company_name} Logos
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500">
                      {brandGroups.find(b => b.id === expandedBrand)?.variantCount} variants
                    </span>
                  </>
                ) : (
                  <h3 className="text-xl font-semibold">Select a Logo</h3>
                )}
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {!expandedBrand ? (
                  /* Brand Cards View */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {brandGroups.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => {
                          if (brand.variantCount === 1) {
                            // If only one variant, select it directly
                            loadBrandImage(brand.variants[0]);
                          } else {
                            // Otherwise expand to show variants
                            setExpandedBrand(brand.id);
                          }
                        }}
                        className="relative p-4 border border-gray-200 rounded-lg hover:border-[#374151] hover:shadow-md transition-all group"
                      >
                        {/* Count Badge */}
                        {brand.variantCount > 1 && (
                          <div className="absolute top-2 right-2 bg-[#374151] text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                            {brand.variantCount}
                          </div>
                        )}

                        {/* Logo Preview */}
                        <img
                          src={brand.primaryVariant?.logo_url}
                          alt={brand.company_name}
                          className="w-full h-20 object-contain mb-2"
                        />

                        {/* Brand Name */}
                        <p className="text-sm text-gray-700 truncate font-medium">
                          {brand.company_name}
                        </p>

                        {/* Hint text for multiple variants */}
                        {brand.variantCount > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Click to view all
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Variant Grid View */
                  (() => {
                    const brand = brandGroups.find(b => b.id === expandedBrand);
                    return brand ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {brand.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => loadBrandImage(variant)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-[#374151] hover:shadow-md transition-all text-left"
                          >
                            {/* Logo Preview */}
                            <div className="h-24 flex items-center justify-center mb-3 bg-gray-50 rounded">
                              <img
                                src={variant.logo_url}
                                alt={`${variant.logo_type} ${variant.theme || ''}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>

                            {/* Badges */}
                            <div className="space-y-2">
                              {/* Format Badge - Most Important */}
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded border uppercase ${getFormatColor(variant.logo_format)}`}>
                                  {variant.logo_format || 'N/A'}
                                </span>
                                {variant.width && variant.height && (
                                  <span className="text-xs text-gray-500">
                                    {variant.width}×{variant.height}
                                  </span>
                                )}
                              </div>

                              {/* Type and Theme Badges */}
                              <div className="flex flex-wrap gap-1">
                                {variant.logo_type && (
                                  <span className={`px-2 py-0.5 text-xs rounded border capitalize ${getTypeColor(variant.logo_type)}`}>
                                    {variant.logo_type}
                                  </span>
                                )}
                                {variant.theme && (
                                  <span className="px-2 py-0.5 text-xs rounded border capitalize bg-gray-100 text-gray-700 border-gray-200">
                                    {variant.theme}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()
                )}
              </div>

              <div className="p-6 border-t">
                <button
                  onClick={() => {
                    setShowLogoSelector(false);
                    setExpandedBrand(null);
                  }}
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

        {/* Create Folder Modal */}
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onSubmit={handleCreateFolder}
        />
      </div>
    </GmailLayout>
  );
}